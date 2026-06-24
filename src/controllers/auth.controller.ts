//src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma"; 
import { signToken } from "../utils/jwt"
import { Role } from "../generated/prisma/client"
import { AuthRequest } from "../middleware/auth.middleware";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password,name,role } = req.body;
    //validation 
    if(!name || !email || !password || !role){
      return res.status(400).json({ message: "name field and email field and password field are required", });
    }

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
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    return res.status(201).json({message: "User registered successfully", user, token });
  }
  catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const login = async (req: Request, res: Response) => {

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

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
    return res.status(200).json({
      message: "Login successful",
      user:{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
     });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
 }
};

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
        createdAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
  } 
  
  
