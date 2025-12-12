
import { ObjectId } from "mongodb";
import { getDB } from "../db/mongodb"
import { IResolvers } from "@graphql-tools/utils";
import { signToken } from "../auth";
import { Project,Task,User } from "../types/types";
import bcrypt from "bcryptjs"


const ProjectsCollection = ()=>getDB().collection<Project>("Proyectos")
const UsersCollection = ()=>getDB().collection<User>("Usuarios")
const TasksCollection = ()=> getDB().collection<Task>("Tareas")

export const resolvers: IResolvers = {
    
    Query:{
        me: async(_,__,{user}) => {  
            if(!user) return null;
            return {
                _id: user._id.toString(),
                ...user
            }
        },

        myProjects: async(_,__,{user}) => { 
            if(!user) return null;
            const userId = new ObjectId(user._id);

            return ProjectsCollection().find({
                $or: [{owner: userId}, {members: userId}]
            }).toArray();            
        },

        projectDetails: async(_,{projectId}, {user}) => {
            if(!user) return null;

            const project = await ProjectsCollection().findOne({
                _id: new ObjectId(projectId)
            });

            if(!project) return null;
            //pregunta
            return project;
        },

        users: async () => {
            return await UsersCollection().find().toArray();
        }

    },

    Project: {
        tasks: async (parent: Project) => {
            return ProjectsCollection().find({
                _id: new ObjectId(parent._id)
            }).toArray();
        }
    },


    Mutation:{

        register: async(_,{input}) => {

            const { username, email, password } = input;

            const existname= await UsersCollection().findOne({username})
            if(existname) return null;

            const existemail= await UsersCollection().findOne({email})
            if(existemail)return null;

            const passwordencriptada = await bcrypt.hash(password,10);

            const result =await UsersCollection().insertOne({
                username,
                email,
                password : passwordencriptada,
                createdAt: new Date()
            });

            return {userId: signToken(result.insertedId.toString())};
        },

        login: async (_,{input}) => {

            const { email, password } = input;

            const user = await UsersCollection().findOne({email})
            if(!user)return null;

            const valid = await bcrypt.compare(password, user.password)
            if(!valid) return null;

            return {userId: signToken( user._id.toString())} 
        },

        createProject: async(__,{input},{user}) => {

            if(!user)return null;

            const {name,description,startDate,endDate} = input;

            const result = await ProjectsCollection().insertOne({
                name,
                description,
                startDate,
                endDate,
                owner: new ObjectId(user._id),
                members:[]
                
            });

            return await ProjectsCollection().findOne({_id:result.insertedId})
        },

        updateProject: async (_,{projectId,input},{user}) => {

            if(!user)return null;

            const {name,description,startDate,endDate} = input;

            const project = await ProjectsCollection().findOne({ _id: new ObjectId(projectId) });
            
            if(!project)return null;

            if(project.owner.toString()!== user._id.toString()) return null;
            
            const result= await ProjectsCollection().updateOne({_id:new ObjectId(projectId)},
            {$set: {name,description,startDate,endDate}})
        
            return ProjectsCollection().findOne({_id:new ObjectId(projectId)});
        },

        addMember:async (_,{projectId,userId},{user}) => {

            if(!user)return null;

            const proyecto= await ProjectsCollection().findOne({_id:new ObjectId(projectId)});

            if(!proyecto)return null;

            if(proyecto.owner.toString()!== user._id.toString()) return null;

             await ProjectsCollection().updateOne(
                {_id: new ObjectId(projectId)},
                {$addToSet:{members: new ObjectId(userId)}});

                return await ProjectsCollection().findOne({_id: new ObjectId(projectId)})
        },

        createTask: async (_,{projectId,input},{user}) => {

            if(!user)return null;

            const proyecto = await ProjectsCollection().findOne({_id: new ObjectId(projectId)});

            if(!proyecto) return null;

            const isOwner = proyecto.owner.toString() === user._id.toString();
            const isMember = proyecto.members.some((m) => m.toString() === user._id.toString());

            if(!isOwner && !isMember) return null;

            const {title,assignedTo,priority,dueDate}=input

            const result= await TasksCollection().insertOne({
                title,
                assignedTo,
                projectId:projectId,
                status:"PENDING",
                priority,
                dueDate
            });

            return TasksCollection().findOne({_id: result.insertedId });
        },

        updateTaskStatus: async (_,{taskId,status},{user}) => {

            if(!user)return null;

            const tarea = await TasksCollection().findOne({_id: new ObjectId(taskId)});
            if(!tarea) return null; 

            await TasksCollection().updateOne({_id:new ObjectId(taskId)},{
               $set:{status:status}
            })

            return await TasksCollection().findOne({_id: new ObjectId(taskId)});
        },

        deleteProject: async (_,{id},{user})=>{

            if(!user)return null;
            
            const proyecto = await ProjectsCollection().findOne({_id:new ObjectId(id)});
            if(!proyecto)return null;

            if(proyecto.owner.toString() !== user._id.toString()) return null;

            await TasksCollection().deleteMany({projectId: new ObjectId(id)})           
            await ProjectsCollection().deleteOne({_id:new ObjectId(id)});

            return "Se ha eliminado el proyecto y sus tareas"
        }
        
    }

}
           