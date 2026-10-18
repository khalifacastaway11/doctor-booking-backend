import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { sendPasswordResetEmail } from "../services/email.service";
import logger from "../lib/logger";
import { serializeError } from "../utils/serialize-error";


const RESET_TOKEN_BYTES = 32

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; //1 hour

//post /api/auth/forget-password

export const forgotPassword = async (req: Request, res: Response) => {
    try {
         const { email } = req.body

         
         //check user exists or not
         const user=await prisma.user.findUnique({
            where:{email}
         })
         
        //always return success to prevent email enumeration
        if(!user){
            return res.status(200).json({
                message:"If that email exists, a reset link has been sent."
            })

        }

        //generate raw token sent with the email and hash stored in DB
        const rawToken=crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex")

        //hash stored in DB for verification
        const hashedToken=crypto.createHash("sha256").update(rawToken).digest("hex")
        const expiry=new Date(Date.now() + TOKEN_EXPIRY_MS)

        await prisma.user.update({
            where:{id:user.id},
           data:{
                resetToken:hashedToken,
                 resetTokenExpiry:expiry
                },
        });

      const frontendURL=process.env.FRONTEND_URL||"http://localhost:3000"
      const resetLink=`${frontendURL}/reset-password/${rawToken}`  

      try{
       await sendPasswordResetEmail(user.email, user.name, resetLink);
       logger.info(`✅ Reset email sent to ${user.email}`)
      } catch(emailError){
        logger.error("Failed to send reset email:",{error:serializeError(emailError)});
        
      }
      logger.info(`Password reset requested for ${email}`)

      return res.status(200).json({
        message:"if email exists,a reset link has been sent.",
      })
    } catch (error) {
        logger.error("FORGET PASSWORD ERROR:",{error:serializeError(error)})
        return res.status(500).json({
            message:"Internal server error"
        })
    }
        
}

//OPST /api/auth/reset-password/:token
export const resetPassword=async(req:Request,res:Response)=>{
    try {
        const tokenParam=req.params.token;
        const rawToken=Array.isArray(tokenParam)?tokenParam[0]:tokenParam
        const{password}=req.body

       

       

        const hashedToken= crypto.createHash("sha256").update(rawToken).digest("hex")

        const user= await prisma.user.findFirst({
            where:{
                resetToken:hashedToken,
                resetTokenExpiry:{gt: new Date()},
            },
        });

        if(!user){
            return res.status(400).json({
                message:"Invalid or expired reset token.",
            })
        }

        const hashedPassword=await bcrypt.hash(password,10)

        await prisma.user.update({
            where:{id:user.id},
            data:{
                password:hashedPassword,
                resetToken:null,
                resetTokenExpiry:null
            },
        })
        logger.info(`password reset completed for${user.email}`)
        return res.status(200).json({
            message:"password reset successfully.You can log in now."
        })
    }catch(error){
        logger.error("RESET PASSWORD ERROR : ",{error:serializeError(error)})
        return res.status(500).json({
            message:"Internal server error."
        })
    }
        
    }





