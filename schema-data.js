window.SQL_SCHEMA = {
  Customers: {
    description:
      "Stores information about customers who purchase products.",
    columns: [
      {
        name: "customerID",
        type: "INT",
        key: "PK",
        description: "Unique ID of the customer"
      },
      {
        name: "CustomerName",
        type: "VARCHAR(50)",
        key: "—",
        description: "Full name of a customer"
      },
      {
        name: "city",
        type: "VARCHAR(30)",
        key: "—",
        description: "City where a customer lives"
      },
      {
        name: "gender",
        type: "CHAR(1)",
        key: "—",
        description: "M/F"
      },
      {
        name: "age",
        type: "INT",
        key: "—",
        description: "Age of a customer"
      }
    ],
    sampleData: [
      [1, "Arun Kumar", "Chennai", "M", 25],
      [2, "Priya Sharma", "Bangalore", "F", 28],
      [3, "Rahul Verma", "Mumbai", "M", 32],
      [4, "Divya Raj", "Chennai", "F", 24],
      [5, "Karthik S", "Coimbatore", "M", 29],
      [6, "Sneha Iyer", "Bangalore", "F", 31],
      [7, "Vijay Anand", "Hyderabad", "M", 35],
      [8, "Meena Devi", "Madurai", "F", 27],
      [9, "Suresh Babu", "Chennai", "M", 41],
      [10, "Anitha R", "Kochi", "F", 30]
    ]
  },
  Products: {
    description:
      "Stores information about products available for sale, including category, price and stock.",
    columns: [
      {
        name: "ProductID",
        type: "INT",
        key: "PK",
        description: "Unique ID of the product"
      },
      {
        name: "ProductName",
        type: "VARCHAR(50)",
        key: "—",
        description: "Name of the product"
      },
      {
        name: "Category",
        type: "VARCHAR(30)",
        key: "—",
        description: "Category of the product"
      },
      {
        name: "Price",
        type: "DECIMAL(10,2)",
        key: "—",
        description: "Selling price of the product"
      },
      {
        name: "Stock",
        type: "INT",
        key: "—",
        description: "Number of units available"
      }
    ],
    sampleData: [
      [101, "Laptop Pro 14", "Laptop", 65000, 25],
      [102, "Laptop Air 13", "Laptop", 58000, 18],
      [103, "Gaming Laptop", "Laptop", 85000, 12],
      [104, "Wireless Mouse", "Accessories", 1200, 100],
      [105, "Mechanical Keyboard", "Accessories", 3500, 60],
      [106, "USB-C Hub", "Accessories", 1800, 75],
      [107, "24 Inch Monitor", "Monitor", 14500, 30],
      [108, "27 Inch Monitor", "Monitor", 22000, 20],
      [109, "32 Inch Monitor", "Monitor", 32000, 15],
      [110, "Smartphone X", "Mobile", 45000, 35]
    ]
  },
  Sales: {
    description:
      "Stores details of product sales made to customers.",
    columns: [
      {
        name: "SaleID",
        type: "INT",
        key: "PK",
        description: "Unique ID of the sale"
      },
      {
        name: "CustomerID",
        type: "INT",
        key: "FK",
        description: "Customer who purchased"
      },
      {
        name: "ProductID",
        type: "INT",
        key: "FK",
        description: "Product purchased"
      },
      {
        name: "SaleDate",
        type: "DATE",
        key: "—",
        description: "Date of sale"
      },
      {
        name: "Quantity",
        type: "INT",
        key: "—",
        description: "Number of units sold"
      }
    ],
    sampleData: [
      [1001, 1, 101, "2024-01-05", 1],
      [1002, 2, 110, "2024-01-08", 1],
      [1003, 3, 104, "2024-01-10", 2],
      [1004, 4, 105, "2024-01-15", 1],
      [1005, 5, 102, "2024-01-20", 1],
      [1006, 6, 106, "2024-02-05", 2],
      [1007, 7, 103, "2024-02-12", 1],
      [1008, 8, 108, "2024-02-18", 3],
      [1009, 9, 107, "2024-03-01", 1],
      [1010, 9, 109, null, 1]
    ]
  }
};
