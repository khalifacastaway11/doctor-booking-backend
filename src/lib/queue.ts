import { Queue,Worker } from "bullmq";
import redis from "./redis";

export const reminderQueue=new Queue("reminder",{
    connection: redis
})

export const reminderWorker=new Worker("reminder",
    async(job)=>{
        //handle job will be imported from worker file
        const{handler}=await import("../workers/reminder.worker");
        return handler(job);
    },
    {
        connection: redis
    }
)