const express = require('express')
const router=express.Router();
const Product=require('../../models/Product')

const ErrorHandler=require('../../utils/errorHandler')
const catchAsyncErrors=require('../../middlewares/catchAsyncErrors')
const APIFeatures = require('../../utils/apiFeatures')

const {isAuthenticatedUser,authorizeRoles} = require('../../middlewares/auth')

// @route     POST api/products
// @desc      create new product
// @access    private
router.post('/admin/product/new', isAuthenticatedUser,authorizeRoles('admin'), catchAsyncErrors(async (req,res)=>{
    console.log("entered")
        const product=await Product.create(req.body);

        res.status(200).json({
            success:true,
            product
        })
}))

// @route     POST api/products?keyword=apple
// @desc      get all products
// @access    public
router.get('/products', catchAsyncErrors(async (req,res)=>{

    const resPerPage=4
    const productsCount=await Product.countDocuments()

    console.log("products")
    const apiFeatures = new APIFeatures(Product.find(),req.query)
                        .search()
                        .filter()

    let products=await apiFeatures.query
    let filteredProductsCount=products.length;

    apiFeatures.pagination(resPerPage)
    products=await apiFeatures.query

        res.status(200).json({
            success:true,
            productsCount,
            resPerPage,
            filteredProductsCount,
            products
        })

}))

// @route     POST api/product/:id
// @desc      get single product details
// @access    public
router.get('/product/:id', async (req,res,next)=>{
    try {
        const produts=await Product.findById(req.params.id);

        if(!product) {
            return next(new ErrorHandler('Product not Found',404))
        }

        res.json({
            success:true,
            produt
        })

    } catch (err) {
        console.error(err.message)        
        res.status(500).send('Server Error')
    }
})

// @route     Put api/product/:id
// @desc      update product
// @access    private
router.put('/admin/product/:id', isAuthenticatedUser,authorizeRoles('admin'), async (req,res,next)=>{
    try {
        const product=await Product.findById(req.params.id);

        if(!product) {
            return next(new ErrorHandler('Product not Found',404))
        }

        product=await Product.findByIdAndUpdate(req.params.id,req.body)

        res.json({
            success:true,
            product
        })

    } catch (err) {
        console.error(err.message)        
        res.status(500).send('Server Error')
    }
})

// @route     delete api/product/:id
// @desc      update product
// @access    private
router.delete('/admin/product/:id', isAuthenticatedUser,authorizeRoles('admin'), async (req,res)=>{
    try {
        const product=await Product.findById(req.params.id);

        if(!product) {
            return next(new ErrorHandler('Product not Found',404))
        }

        await Product.remove()

        res.json({
            success:true,
            message:'Product is deleted'
        })

    } catch (err) {
        console.error(err.message)        
        res.status(500).send('Server Error')
    }
})

//create new review  ==> /api/product/review
router.put('/review',isAuthenticatedUser, catchAsyncErrors(async (req,res)=>{

    const {rating,comment,productId} = req.body;

    const review ={
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment
    }

    const product = await Product.findById(productId)

    const isReviewed=product.reviews.find(
        r=>r.user.toString() === req.user._id.toString()
    )

    if(isReviewed){
        product.reviews.forEach(review=>{
            if(review.user.toString() === req.user._id.toString()){
                review.comment=comment
                review.rating=rating
            }
        })
    }else{
        product.review.push(review)
        product.numOfReviews=product.reviews.length
    }

    product.ratings=product.reviews.reduce((acc,item) => item.rating+acc,0) / product.reviews.length
    
    await product.save({validateBeforeSave:false})

    res.status(200).json({
        success:true
    })
}))

//get product reviews  ==> /api/product/reviews
router.get('/reviews',isAuthenticatedUser, catchAsyncErrors(async (req,res)=>{
    const product=await Product.findById(req.query.id)

    res.status(200).json({
        success:true,
        reviews:product.reviews
    })
}))

//delete product review  ==> /api/product/reviews
router.delete('/reviews',isAuthenticatedUser, catchAsyncErrors(async (req,res)=>{
    const product=await Product.findById(req.query.productId)

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString())

    const numOfReviews = reviews.length

    const ratings = product.reviews.reduce((acc,item) => item.rating+acc,0) / reviews.length

    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,
        ratings,
        numOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true
    })
}))
 

module.exports=router