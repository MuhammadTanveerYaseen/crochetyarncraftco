const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://meercoder_db_user:gXNh33Gff9n9iS7V@cluster0.wacsqlc.mongodb.net/crochet?appName=Cluster0';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Define schema inline to avoid imports
    const ProductSchema = new mongoose.Schema({
      title: String,
      pdfUrl: String,
    }, { strict: false });
    
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    
    const products = await Product.find({}, 'title pdfUrl').lean();
    console.log('Products in database:');
    console.log(JSON.stringify(products, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
