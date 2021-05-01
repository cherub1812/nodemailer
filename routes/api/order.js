const express = require('express')
const router=express.Router();
const Order=require('../../models/Order')

const ErrorHandler=require('../../utils/errorHandler')
const catchAsyncErrors=require('../../middlewares/catchAsyncErrors')
const APIFeatures = require('../../utils/apiFeatures')

const {isAuthenticatedUser,authorizeRoles} = require('../../middlewares/auth');
const order = require('../../models/Order');
const Product = require('../../models/Product');

//create a new order ==> /api/order/order/new
router.post('/order/new',isAuthenticatedUser, catchAsyncErrors(async (req,res)=>{
    const{
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo
    } = req.body

    const order=await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt:Date.now(),
        user:req.user._id
    })
    
    res.status(200).json({
        success:true,
        order
    })
    
}))

//get single order ==> /api/order/order/:id
router.get('/order/:id',isAuthenticatedUser, catchAsyncErrors(async (req,res)=>{
    const order=await Order.findById(req.params.id).populate('user','name email')

    if(!order){
        return next(new ErrorHandler('No order found with this Id',404))
    }

    res.status(200).json({
        success: true,
        order
    })
}))

//get logged in user orders ==> /api/order/orders/me
router.get('/orders/me',isAuthenticatedUser, catchAsyncErrors(async (req,res)=>{
    const orders=await Order.find({user:req.user.id})

    res.status(200).json({
        success: true,
        orders
    })
}))

//get all orders  - ADMIN ==> /api/order/admin/orders
router.get('/admin/orders',isAuthenticatedUser,authorizeRoles('admin'), catchAsyncErrors(async (req,res)=>{
    const orders=await Order.find
    let totalAmount=0

    orders.forEach(order=>{
        totalAmount+=order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
}))

//UPDATE / process order  - ADMIN ==> /api/order/admin/order/:id
router.put('/admin/order/:id',isAuthenticatedUser,authorizeRoles('admin'), catchAsyncErrors(async (req,res)=>{
    const orders=await Order.findById(req.params.id)
   
    if(order.orderStatus === 'Delivered'){
        return next(new ErrorHandler('You have already delivered this order',400))
    }

    order.orderItems.forEach(async item=>{
        await updateStock(item.product,item.quantity)
    })

    order.orderStatus=req.body.status
    order.deliveredAt=Date.now()

    await order.save()

    res.status(200).json({
        success: true
    })
}))

async function updateStock(id,quantity){
    const product = await Product.findById(id)

    product.stock=product.stock  -quantity

    await product.save( {validateBeforeSave:false} )
}

//delete order  ==> /api/order/admin/order/:id
router.delete('/admin/order/:id',isAuthenticatedUser,authorizeRoles('admin'), catchAsyncErrors(async (req,res)=>{
    const orders=await Order.findById(req.params.id)
    
    if(!order){
        return next(new ErrorHandler('No order found with this Id',404))
    }

    await order.remove()

    res.status(200).json({
        success: true
    })
}))

module.exports=router