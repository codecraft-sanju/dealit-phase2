const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");
const { BudgetsClient, CreateBudgetCommand } = require("@aws-sdk/client-budgets");
const moment = require("moment");
const CreditSetting = require('../models/CreditSetting');

const ceClient = new CostExplorerClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const budgetsClient = new BudgetsClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// CHANGE START: Removed global RAM variables (cachedCostData and lastFetchTime)
// CHANGE END

const fetchAwsDailyCosts = async (cacheHours = 24) => {
  const currentTime = Date.now();
  const CACHE_DURATION = 1000 * 60 * 60 * cacheHours;

  // CHANGE START: Read cache from Database
  let setting = await CreditSetting.findOne();
  if (!setting) {
    setting = new CreditSetting({});
  }

  const lastFetchTime = setting.awsLastFetchTime || 0;
  const cachedCostData = setting.awsCachedData;

  if (
    cachedCostData && 
    Object.keys(cachedCostData).length > 0 && 
    (currentTime - lastFetchTime < CACHE_DURATION)
  ) {
    return {
      ...cachedCostData,
      nextFetchTime: lastFetchTime + CACHE_DURATION
    };
  }
  // CHANGE END

  const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
  const today = moment().format('YYYY-MM-DD');

  if (startOfMonth === today) {
    return { 
      totalCost: 0, 
      dailyCosts: [], 
      services: [], // Array to hold unique service names
      nextFetchTime: currentTime + CACHE_DURATION 
    };
  }

  // Added GroupBy to fetch data by individual AWS Services
  const params = {
    TimePeriod: { Start: startOfMonth, End: today },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
    GroupBy: [
      {
        Type: "DIMENSION",
        Key: "SERVICE"
      }
    ]
  };

  try {
    const command = new GetCostAndUsageCommand(params);
    const response = await ceClient.send(command);

    let totalMonthCost = 0;
    const serviceSet = new Set();
    const dailyCosts = [];

    // Extracting nested group data
    response.ResultsByTime.forEach(result => {
      const date = result.TimePeriod.Start;
      const dayData = { date, amount: 0 }; 

      if (result.Groups && result.Groups.length > 0) {
        result.Groups.forEach(group => {
          const serviceName = group.Keys[0];
          const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
          
          if (cost > 0) { // Keep chart clean by only tracking > $0
            serviceSet.add(serviceName);
            dayData[serviceName] = Number(cost.toFixed(4));
            dayData.amount += cost; // Total for the day
            totalMonthCost += cost; // Total for the month
          }
        });
      }
      
      dayData.amount = Number(dayData.amount.toFixed(2));
      dailyCosts.push(dayData);
    });

    // CHANGE START: Save to Database instead of RAM
    const newCachedCostData = {
      totalCost: Number(totalMonthCost.toFixed(2)),
      dailyCosts,
      services: Array.from(serviceSet) // Send list of services to frontend
    };

    setting.awsCachedData = newCachedCostData;
    setting.awsLastFetchTime = currentTime;
    await setting.save();

    return {
      ...newCachedCostData,
      nextFetchTime: currentTime + CACHE_DURATION
    };
    // CHANGE END
  } catch (error) {
    console.error("AWS Cost Explorer Error:", error);
    throw new Error("Failed to fetch AWS costs");
  }
};

const createFreeTierAlertBudget = async (emailAlertAddress, budgetLimit) => {
  const accountId = process.env.AWS_ACCOUNT_ID; 
  const limitAmount = budgetLimit ? String(budgetLimit) : "1.00"; 

  const params = {
    AccountId: accountId,
    Budget: {
      BudgetName: `Dealit_Alert_${Date.now()}`,
      BudgetType: "COST",
      TimeUnit: "MONTHLY",
      BudgetLimit: {
        Amount: limitAmount, 
        Unit: "USD"
      }
    },
    NotificationsWithSubscribers: [
      {
        Notification: {
          NotificationType: "ACTUAL",
          ComparisonOperator: "GREATER_THAN",
          Threshold: 100, 
          ThresholdType: "PERCENTAGE"
        },
        Subscribers: [
          {
            SubscriptionType: "EMAIL",
            Address: emailAlertAddress
          }
        ]
      }
    ]
  };

  try {
    const command = new CreateBudgetCommand(params);
    const response = await budgetsClient.send(command);
    return response;
  } catch (error) {
    console.error("AWS Budget Creation Error:", error);
    throw new Error("Failed to create AWS budget alert");
  }
};

module.exports = {
  fetchAwsDailyCosts,
  createFreeTierAlertBudget
};