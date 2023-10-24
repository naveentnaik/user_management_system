const User=require("../models/userModel")
const bcrypt=require('bcrypt')
const randomstring=require('randomstring');
const config=require("../config/config")
const nodemailer=require('nodemailer')

const securePassword=async(password)=>{
    try{

       const passwordHash=await bcrypt.hash(password,10)
       return passwordHash;

    }catch(err){
       console.log(err.message)
    }
}

const addUserMail=async(name,email,password,user_id)=>{

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
         subject:'Admin added you, varify your mail',
         html:'<p>hi '+ name +'please click here to <a href="http://127.0.0.1:3000/verify?id='+user_id+'">Verify</a> your mail.</p><br>'+email+'<br><b>'+password+'</b>'
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
         html:'<p>hi '+ name +'please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token='+token+'">Reset</a> your password.</p>'
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


const loadLogin=async(req,res)=>{
    try {
        res.render('login')
        
    } catch (error) {
        console.log(error.message)
    }
}

const verifyLogin=async(req,res)=>{
    try {

        const email=req.body.email;
        const password=req.body.password;

      const userData=await User.findOne({email:email})

      if(userData){

       const passwordMatch=await bcrypt.compare(password,userData.password)

         if(passwordMatch){

            if(userData.is_admin===0){

                res.render('login',{message:"email and password is incorrect"})

            }
            else{
                req.session.user_id=userData._id
                res.redirect('/admin/home')
            }
                
         }
         else{
            res.render('login',{message:"email and password is incorrect"})
         }

      }
      else{
        res.render('login',{message:"email and password is incorrect"})
      }

        
    } catch (error) {
        console.log(error.message)
    }
}

const loadDashboard=async(req,res)=>{
    try {
        const sid=req.session.user_id.trim(' ')
       const userData= await User.findById({_id:sid})
    
        res.render('home',{admin:userData})
    } catch (error) {
        console.log(error.message)
    }
}

const logout=async(req,res)=>{
    try {

        req.session.destroy();
        res.redirect('/admin')
        
    } catch (error) {
        console.log(error.message)
    }
}

const forgetLoad=async(req,res)=>{

    try {

        res.render('forget')
        
    } catch (error) {

        console.log(error.message)
        
    }

}

const forgetVerify=async(req,res)=>{

    try {
       
        const email=req.body.email;
        const userData= await User.findOne({email:email})
        
        if (userData) {

            if(userData.is_admin===0){
                res.render('forget',{message:"email is incorrect"})
            }
            else{
               const randomString=randomstring.generate()
               const updatedData =await User.updateOne({email:email},{$set:{token:randomString}})
               sendResetPasswordMail(userData.name,userData.email,randomString)
               res.render('forget',{message:"Please check your mail"})

            }
            
        } else {
            res.render('forget',{message:"email is incorrect"})
        }
        
    } catch (error) {

        console.log(error.message)
        
    }

}


const forgetPasswordLoad=async(req,res)=>{

    try {

      const token=req.query.token

   const tokenData = await User.findOne({token:token})

   if (tokenData) {

      res.render('forget-password',{user_id:tokenData._id})
    
   } else {

    res.render('404',{message:"Invalid Link"})
    
   }
        
    } catch (error) {

        console.log(error.message)
        
    }


}

const resetPassword=async(req,res)=>{

    try {
         const password=req.body.password
         const user_id=req.body.user_id
         const secure_Password=await securePassword(password)

       const updatedData= await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_Password,token:''}})

        res.redirect("/admin")
        
    } catch (error) {

        console.log(error.message)
        
    }

}

const adminDashboard=async(req,res)=>{

    try {
        const usersData= await User.find({is_admin:0})
        res.render('dashboard',{users:usersData})
        
    } catch (error) {

        console.log(error.message)
        
    }

}


const newUserLoad=async(req,res)=>{

    try {
       res.render('new-user')
        
    } catch (error) {

        console.log(error.message)
        
    }

}

const addUser=async(req,res)=>{

    try {
       const name=req.body.name
       const email=req.body.email
       const mno=req.body.mno
       const image=req.file.filename
       const password=randomstring.generate(8)
       console.log(password)

       const spassword= await securePassword(password)
       console.log(spassword)

       const user=new User({
          name:name,
          email:email,
          mobile:mno,
          image:image,
          password:spassword,
          is_admin:0

       })
         
       const userData= await user.save()

       if(userData){

        addUserMail(name,email,password,userData._id)
        console.log(password)
      
         res.redirect('/admin/dashboard')

       }
       else{
        res.render('new-user',{message:"something went wrong"})
       }

        
    } catch (error) {

        console.log(error.message)
        
    }

}


module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    adminDashboard,
    newUserLoad,
    addUser
}