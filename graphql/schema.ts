import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  type Product {
    _id: ID!
    title: String!
    description: String!
    price: Float!
    salePrice: Float
    category: String!
    difficulty: String!
    images: [String!]!
    pdfUrl: String!
    materials: [String!]
    size: String
    languages: [String!]
    featured: Boolean
    createdAt: String
  }

  type OrderItem {
    productId: ID!
    title: String!
    price: Float!
  }

  type Order {
    _id: ID!
    userId: ID
    customerEmail: String!
    items: [OrderItem!]!
    totalAmount: Float!
    status: String!
    createdAt: String
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    role: String
    createdAt: String
  }

  type Report {
    _id: ID!
    name: String!
    email: String!
    subject: String!
    message: String!
    status: String!
    createdAt: String
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type DashboardStats {
    totalPatterns: Int!
    totalSales: Float!
    activeCategories: Int!
    popularCategory: String!
    averageOrderValue: Float!
    storageProvider: String!
  }

  input OrderItemInput {
    productId: ID!
    title: String!
    price: Float!
  }

  type Query {
    products(category: String, difficulty: String, search: String, sort: String, limit: Int, offset: Int): [Product!]!
    product(id: ID!): Product
    orders(limit: Int, offset: Int): [Order!]!
    dashboardStats: DashboardStats!
    
    # Session Queries
    me: User
    myOrders: [Order!]!
    
    # Support Reports Query (admin, paginated)
    reports(limit: Int, offset: Int): [Report!]!
  }

  type Mutation {
    createProduct(
      title: String!
      description: String!
      price: Float!
      salePrice: Float
      category: String!
      difficulty: String!
      images: [String!]
      pdfUrl: String!
      materials: [String!]
      size: String
      languages: [String!]
      featured: Boolean
    ): Product!

    updateProduct(
      id: ID!
      title: String
      description: String
      price: Float
      salePrice: Float
      category: String
      difficulty: String
      images: [String!]
      pdfUrl: String
      materials: [String!]
      size: String
      languages: [String!]
      featured: Boolean
    ): Product!

    deleteProduct(id: ID!): Boolean!

    createOrder(
      customerEmail: String!
      items: [OrderItemInput!]!
      totalAmount: Float!
      userId: ID
    ): Order!

    # Auth Mutations
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!

    # Report Mutations
    createReport(name: String!, email: String!, subject: String!, message: String!): Report!
    resolveReport(id: ID!): Report!
  }
`);
export default schema;
