//src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma"; 
import { signToken } from "../utils/jwt"
import { Role } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import logger from "../lib/logger";
import { validate } from "zod";
import { serializeError } from "../utils/serialize-error";


const COOKIE_NAME="token"
const cookieOptions={
  httpOnly:true,
  secure:process.env.NODE_ENV==="production",
  sameSite:(process.env.NODE_ENV==="production"?"none":"lax") as |"none"|"lax",
  maxAge:7*24*60*60*1000, //1 week
  path:"/",

}

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password,name,role,timeZone } = req.body;
    

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role && Object.values(Role).includes(role as Role) ? (role as Role) : Role.PATIENT;
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        timeZone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        timeZone: true,
        createdAt: true,
      }
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    //set http only cookie
    res.cookie(COOKIE_NAME,token,cookieOptions)

    return res.status(201).json({message: "User registered successfully", user, });
  }
  catch (error) {
    logger.error("Register error:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const login = async (req: Request, res: Response) => {

  try {
    const { email, password } = req.body;
    

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    //set http only cookie
    res.cookie(COOKIE_NAME,token,cookieOptions)


    return res.status(200).json({
      message: "Login successful",
      user:{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        timeZone: user.timeZone,
      },
     });
  } catch (error) {
    logger.error("Login error:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
 }
};

   //logout
 export const logout=async(req:Request,res:Response)=>{
    res.clearCookie(COOKIE_NAME,{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:(process.env.NODE_ENV==="production")?"none":"lax",
      path:"/",
    })
    res.status(200).json({
      message:"Logout successful",
    })
  }

  export const me= async(req:AuthRequest,res:Response)=>{
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        timeZone: true,
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    logger.error("me error:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }

 
  } 
  
export const updateTimeZone= async(req:AuthRequest,res:Response)=>{
    try {

      if(!req.user){
        return res.status(401).json({message:"Unauthorized"});
      }
      const {timeZone}=req.body;
      
      const user=await prisma.user.update({
        where:{id:req.user.userId},
        data:{timeZone},
      })
      return res.status(200).json({user});
      
    } catch (error) {
      logger.error("Update timezone error:", {error:serializeError(error)});
      return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { name, email } = req.body;

   

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    

    // Check if email is taken by another user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user.userId) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        timeZone: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updated,
    });
  } catch (error) {
    logger.error("UPDATE PROFILE ERROR:", {error:serializeError(error)});
    return res.status(500).json({ message: "Internal server error" });
  }
};