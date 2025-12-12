import { gql} from "apollo-server";

export const typeDefs = gql`

type User{
    _id:ID!
    username: String!
    email:String
    createdAt:String!
}


type Project {
    _id: ID!
    name: String!
    description: String
    startDate: String!
    endDate: String!
    owner: ID!
    members: [ID]
    tasks:[Task!]!
}

type Task {
    _id: ID!
    title: String!
    projectId: ID!
    assignedTo:ID
    status: String!
    priority: String!
    dueDate:String!
}

type AuthPayLoad {
    userId: String!
}

input RegisterInput {
    username: String!
    email: String!
    password: String!
}

input LoginInput {
    email: String!
    password: String!
}

input CreateProjectInput{
    name:String!
    description:String
    startDate: String!
    endDate: String!
    
}

input TaskInput{
  title: String!
  assignedTo: ID
  priority: String!
  dueDate: String
}

input UpdateProjectInput{
    name:String
    description:String
    startDate:String
    endDate:String
}


type Query {
    me: User
    myProjects:[Project!]!
    projectDetails(projectId:ID!): Project
    users:[User!]!
}

type Mutation{
    register(input:RegisterInput!):AuthPayLoad!
    login(input:LoginInput!):AuthPayLoad!

    createProject(input:CreateProjectInput!):Project!
    updateProject(projectId: ID!,input: UpdateProjectInput!):Project!
    addMember(projectId: ID!,userId:ID!):Project!
    createTask(projectId:ID!,input:TaskInput!): Task!
    updateTaskStatus(taskId: ID!, status:String!):Task!
    deleteProject(id:ID!):String!
}

`;