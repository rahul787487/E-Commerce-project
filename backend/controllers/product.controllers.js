import e from 'express';
import cloudinary from '../lib/cloudnary.js';   
import Product from '../models/product.model.js';
import { redis } from '../lib/redis.js';



export const getAllProducts = async (req, res) => {

    try {
        const products = await Product.find({});// Fetch all products from the database
        res.status(200).json(products); // Send the products as JSON response       
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error', error: error.message });


    }
};


export const adminRoute = async (req, res,next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        
        let featuredProducts = await redis.get('featuredProducts');
        if (featuredProducts) {
            console.log('Serving featured products from Redis cache');
            return res.status(200).json(JSON.parse(featuredProducts));
        }

        // If not in redis cache, fetch from database
        //learn() to get plain JS objects instead of Mongoose documents
        // which improves performance
        featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (!featuredProducts) {
            return res.status(404).json({ message: 'No featured products found' });
        }
        // Store the result in Redis cache for future requests
        await redis.set('featuredProducts', JSON.stringify(featuredProducts),) // Cache for 1 hour
        res.json(featuredProducts);

    } catch (error) {
        
        console.error('Error fetching featured products:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }

}

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category ,image } = req.body;

        let cloudinaryResponse=null;
        if(image){
            await cloudinary.uploader.upload(image, {
                folder: 'products',
            })
            const product = await Product.create({
                name,
                description,
                price,
                category,
                image: cloudinaryResponse.secure_url? cloudinaryResponse.secure_url : '',
        });
        res.status(201).json({ message: 'Product created successfully', product });
        } 
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
        
    }
}
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (product.image) {
            // Extract public ID from the image URL
            const publicId = product.image.split('/').pop().split('.')[0];// assuming the image URL ends with the file extension
            await cloudinary.uploader.destroy(`products/${publicId}`);
            console.log('Image deleted from Cloudinary');
        }
        await product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
        
    }
}

export const getRecommendedProducts = async (req, res) => {
    try{ const products = await Product.aggregate([
        { $sample: { size: 3 } } ,// Adjust the size as needed
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                price: 1,
                image: 1,
            }
        }
    ]);
    res.status(200).json(products);
    } catch (error) {
        
        console.error('Error fetching recommended products:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}                 

export const getProductsByCategory = async (req, res) => {
    const category = req.params;
    try {
        const products = await Product.find({ category: category });
        res.status(200).json(products);
    } catch (error) {
        
        console.error('Error fetching products by category:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export const toggeleFEaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product)    {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updatefeaturedProductsCache();
            return res.status(200).json({ message: 'Product featured status toggled', product: updatedProduct });
        } else {
            return res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        
        console.error('Error toggling featured status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
async function updatefeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({ isFeatured: true }).lean();
        await redis.set('featuredProducts', JSON.stringify(featuredProducts)); 
        console.log('Featured products cache updated');
    } catch (error) {
        console.error('Error updating featured products cache:', error);
    } 
}