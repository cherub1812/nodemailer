const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProductSchema = new Schema({
    name:{
        type:String,
        required:[true,'Please enter Product name'],
        trim:true,
        maxLength:[100,'Product name cannot exceed 100 characters']
    },
    price:{
        type:Number,
        required:[true,'Please enter Product price'],
        maxLength:[5,'Product price cannot exceed 5 characters'],
        default:0.0
    },
    description:{
        type:String,
        required:[true,'Please enter Product description'],
        trim:true,
    },
    ratings:{
        type:Number,
        default:0
    },
    images:[
        {
            pubic_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required:true
            }
        }
    ],
    category:{
        type:String,
        required:[true,'Please select category for this product'],
        enum:{
            values:[
                'Electronics',
                'Shirts',
                'Cameras',
                'Accessories',
                'Headphones',
                'Food',
                'Books',
                'Clothes/Shoes',
                'Beauty/Health',
                'Sports'
            ],
            message:'Please select correct category for product'
        }
    },
    seller:{
        type:String,
        required:[true,'Please enter product seller']
    },
    stock:{
        type:Number,
        required:[true,'Please enter product stock quantity'],
        maxLength:[5,'Product stock cannot exceed 5 characters'],
        default:0
    },
    numOfReviews:{
        type:Number,
        default:0
    },
    reviews:[
        {
            user:{
                type:mongoose.Schema.ObjectId,
                ref:'User',
                required:true
            },
            name:{
                type:String,
                required:true
            },
            rating:{
                type:Number,
                required:true
            },
            comment:{
                type:String,
                required:true
            }
        }
    ],
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports = Product = mongoose.model('product', ProductSchema)