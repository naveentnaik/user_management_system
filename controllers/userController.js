const User=require('../models/userModel')
const bcrypt=require('bcrypt')
const nodemailer=require("nodemailer")
const randomstring=require("randomstring")
const config=require('../config/config')


const securePassword=async(password)=>{
    try{

       const passwordHash=await bcrypt.hash(password,10)
       return passwordHash;

    }catch(err){
       console.log(err.message)
    }
}

const sendVarifyMail=async(name,email,user_id)=>{

   try {

   const transporter= nodemailer.createTransport({
        host:'smtp.gmail.com',
        port:587,
        requireTLS:true,
        auth:{
            user:config.userEmail,
            pass:config.userPassword
        }
    })

    const mailOptions={
        from:'nana.naveen50@gmail.com',
        to:email,
        subject:'for Verification mail',
        html:'<p>hi '+ name +'please click here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'">Verify</a> your mail.</p>'
    }

    transporter.sendMail(mailOptions,(error,info)=>{
        if(error){
            console.log(error);
        }
        else{
            console.log("Email has been sent:-",info.response)
        }
    })

   } catch (err) {

    console.log(err)

   }

}

const sendResetPasswordMail=async(name,email,token)=>{

    try {
 
    const transporter= nodemailer.createTransport({
         host:'smtp.gmail.com',
         port:587,
         requireTLS:true,
         auth:{
             user:config.userEmail,
             pass:config.userPassword
         }
     })
 
     const mailOptions={
         from:'nana.naveen50@gmail.com',
         to:email,
         subject:'for Reset Password',
         html:'<p>hi '+ name +'please click here to <a href="http://127.0.0.1:3000/reenter-password?token='+token+'">Reset</a> your password.</p>'
     }
 
     transporter.sendMail(mailOptions,(error,info)=>{
         if(error){
             console.log(error);
         }
         else{
             console.log("Email has been sent:-",info.response)
         }
     })
 
    } catch (err) {
 
     console.log(err)
 
    }
} 

const loadRegister=async(req,res)=>{

    try{

        res.render('registration')
      
    }catch(err){

        console.log(err.message)

    }    

}

const insertUser=async(req,res)=>{
  
    try{

        const spassword= await securePassword(req.body.password)

        const user=new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            image:req.file.filename,
            password:spassword,
            is_admin:0
        });

       const userData=await user.save()

       if(userData){

           sendVarifyMail(req.body.name,req.body.email,userData._id)
           res.render('registration',{message:"Your registration has been sucsessful.please varify your email"})

       }
       else{

           res.render('registration',{message:"Your registration has been failed"})

       }

      }catch(err){

        console.log(err.message)

      }

}

const verifyMail=async(req,res)=>{

    try {

     const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_varified:1}})
        
     console.log(updateInfo)

     res.render("email-verified")

    } catch (error) {
        console.log(error)
    }

}

const loginLoad=async(req,res)=>{

    try {

        res.render('login')
        
    } catch (error) {
          
         console.log(error)

    }

}

const verifyLogin=async(req,res)=>{

    try {
        const email=req.body.email;
        const password=req.body.password;

        console.log(email)
        console.log(password)
        
        const userData= await User.findOne({email:email})

        if (userData) {
          console.log( await bcrypt.hash(password,10)) 
           const passwordMatch=await bcrypt.compare(password,userData.password);
          

           if (passwordMatch) {
                
               if (userData.is_varified===0) {
                   
                   res.render('login',{message:"please verify your mail"}) 

               } else {

                  req.session.user_id=userData._id
                  res.redirect('/home')

               }
                          
            
           } else {

                res.render('login',{message:"Email and password is incorrect"})

           }
            
        } else {
            res.render('login',{message:"Email and password is incorrect"})
        }
        
    } catch (error) {
          
         console.log(error)

    }

}

const loadHome= async(req,res)=>{

    const sid=req.session.user_id.trim(' ')
 
    try {
   const userData =await User.findById({_id:sid})     
   
     res.render('home',{user:userData})

    } catch (error) {
        
         console.log(error.message)

    }

}

const userLogout = async(req,res)=>{
 
    try {
         
      req.session.destroy()

     res.redirect('/')

    } catch (error) {
        
         console.log(error.message)

    }

}

const forgotLoad = async(req,res)=>{
 
    try {
         
     res.render('forgot-password')

    } catch (error) {
        
         console.log(error.message)

    }

}

const forgotVerify = async(req,res)=>{
 
    try {
         
      const email=req.body.email;

     const userData=await User.findOne({email:email})

     if (userData) {
         
        if (userData.is_varified===0) {

            res.render('forgot-password',{message:"please verify your email"})
            
        } else {
         
            const randomString = randomstring.generate()

            const updatedData= await User.updateOne({email:email},{$set:{token:randomString}})

            sendResetPasswordMail(userData.name,userData.email,randomString)

            res.render('forgot-password',{message:"please check your mail to reset password"})
            
        }


     } else {
        
         res.render('forgot-password',{message:"user email is incorrect"})

     }

    } catch (error) {
        
         console.log(error.message)

    }

}

const forgotPasswordLoad=async(req,res)=>{

          try {
                
            const token=req.query.token;
            const tokenData= await User.findOne({token:token})

            if(tokenData){

                res.render('reenter-password',{user_id:tokenData._id})

            }else{
                res.render('404',{message:"Token is invalid"})
            }
            
          } catch (error) {
             console.log(error.message)
          }


}

const resetPassword=async(req,res)=>{

     try {

          const password=req.body.password;
          const user_id=req.body.user_id.trim('');

          const secure_Password= await securePassword(password)

          const updatedData= await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_Password,token:''}})
          
          res.redirect('/')
        
     } catch (error) {
        console.log(error.message)
     }

}

const verificationLoad=async(req,res)=>{

     try {

        res.render('verification')
        
     } catch (error) {
        console.log(error.message)
     }

}

const sentVerifcationLink=async(req,res)=>{

    try {

        const email=req.body.email;
       const userData= await User.findOne({email:email})

       if(userData){

          if(userData.is_varified===1){
            res.render('verification',{message:"Your mail is already verified"})
          }
          else{

            sendVarifyMail(userData.name,userData.email,userData._id)
             res.render('verification',{message:"verification link sent to your email id"})
          }
           
       }
       else{
        res.render('verification',{message:"this email doesent exist"})
       }
        
    } catch (error) {
        console.log(error.message);
    }

}

const editLoad=async(req,res)=>{
    try {
        const id=req.query.id

       const userData= await User.findById({_id:id})

       if(userData){

           res.render('edit',{user:userData})

       }else{
        res.redirect('/home')
       }
      
    } catch (error) {
        console.log(error.message)
    }

}

const updateProfile =async(req,res)=>{
    try {
        const iid=req.body.user_id.trim(" ")
        if(req.file){
            const userData= await User.findByIdAndUpdate({_id:iid},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno,image:req.file.filename}})
        }
        else{
         const userData= await User.findByIdAndUpdate({_id:iid},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno}})
        }
     res.redirect('/home')
        
    } catch (error) {
        console.log(error.message)
    }
}

module.exports={
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgotLoad,
    forgotVerify,
    forgotPasswordLoad,
    resetPassword,
    verificationLoad,
    sentVerifcationLink,
    editLoad,
    updateProfile
}