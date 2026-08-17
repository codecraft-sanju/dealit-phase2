const { CostExplorerClient, GetCostAndUsageCommand } = require("@aws-sdk/client-cost-explorer");
const { BudgetsClient, CreateBudgetCommand } = require("@aws-sdk/client-budgets");
const moment = require("moment");

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

let cachedCostData = null;
let lastFetchTime = 0;
// 24 Hours ka cache set kiya gaya hai (Cost bachane ke liye best)
const CACHE_DURATION = 1000 * 60 * 60 * 24; 

const fetchAwsDailyCosts = async () => {
  const currentTime = Date.now();

  // Agar cache expire nahi hua hai, toh purana data aur nextFetchTime bhej do
  if (cachedCostData && (currentTime - lastFetchTime < CACHE_DURATION)) {
    return {
      ...cachedCostData,
      nextFetchTime: lastFetchTime + CACHE_DURATION
    };
  }

  const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
  const today = moment().format('YYYY-MM-DD');

  if (startOfMonth === today) {
    return { 
      totalCost: 0, 
      dailyCosts: [], 
      nextFetchTime: currentTime + CACHE_DURATION 
    };
  }

  const params = {
    TimePeriod: { Start: startOfMonth, End: today },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"]
  };

  try {
    const command = new GetCostAndUsageCommand(params);
    const response = await ceClient.send(command);

    let totalMonthCost = 0;
    const dailyCosts = response.ResultsByTime.map(result => {
      const amount = parseFloat(result.Total.UnblendedCost.Amount);
      totalMonthCost += amount;
      return {
        date: result.TimePeriod.Start,
        amount: Number(amount.toFixed(2))
      };
    });

    // Naya data cache mein save karo
    cachedCostData = {
      totalCost: Number(totalMonthCost.toFixed(2)),
      dailyCosts
    };
    lastFetchTime = currentTime;

    // Data ke sath nextFetchTime bhi bhej do
    return {
      ...cachedCostData,
      nextFetchTime: lastFetchTime + CACHE_DURATION
    };
  } catch (error) {
    console.error("AWS Cost Explorer Error:", error);
    throw new Error("Failed to fetch AWS costs");
  }
};

// Yahan emailAlertAddress ke sath budgetLimit bhi add kiya hai
const createFreeTierAlertBudget = async (emailAlertAddress, budgetLimit) => {
  const accountId = process.env.AWS_ACCOUNT_ID; 
  const limitAmount = budgetLimit ? String(budgetLimit) : "1.00"; // Fallback to $1 if nothing provided

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