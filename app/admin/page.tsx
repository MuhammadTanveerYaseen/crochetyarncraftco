'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Coins, 
  Layers, 
  BookOpen, 
  Settings, 
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  FolderOpen,
  LifeBuoy,
  User,
  Megaphone,
  Send
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { graphqlRequest } from '@/lib/graphqlClient';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';

export default function AdminDashboard() {
  const { showToast } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalPatterns: 0,
    totalSales: 0,
    activeCategories: 0,
    popularCategory: 'Amigurumi',
    averageOrderValue: 0,
    storageProvider: 'Local Storage'
  });
  
  const [activeAdminTab, setActiveAdminTab] = useState<'listings' | 'reports' | 'users'>('listings');
  const [reports, setReports] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const [promoSubject, setPromoSubject] = useState('🧶 Exclusive Offer from Yarn Craft Co!');
  const [promoCodeInput, setPromoCodeInput] = useState('MAKER20');
  const [promoDiscountPct, setPromoDiscountPct] = useState('20');
  const [promoMessageText, setPromoMessageText] = useState('We wanted to say thank you for being a part of our crochet community! Use this exclusive code during checkout to claim your savings on any pattern.');
  const [sendingPromo, setSendingPromo] = useState(false);
  
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [promoSegment, setPromoSegment] = useState<'all' | 'non-purchasers' | 'purchasers' | 'vips'>('all');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Table Filters & Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form & Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Input fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [category, setCategory] = useState('amigurumi');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [images, setImages] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [materials, setMaterials] = useState('');
  const [size, setSize] = useState('');
  const [languages, setLanguages] = useState('English');
  const [featured, setFeatured] = useState(false);

  // File uploading states
  const [imageUploading, setImageUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [categoriesList, setCategoriesList] = useState<string[]>(['amigurumi', 'clothing', 'home-decor', 'accessories', 'holiday']);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [drawerTab, setDrawerTab] = useState<'edit' | 'preview'>('edit');
  const [discountPercent, setDiscountPercent] = useState('');

  const handlePriceChange = (val: string) => {
    setPrice(val);
    const parsedPrice = parseFloat(val);
    if (!isNaN(parsedPrice) && parsedPrice > 0) {
      if (discountPercent) {
        const parsedDiscount = parseFloat(discountPercent);
        if (!isNaN(parsedDiscount)) {
          const calculatedSale = parsedPrice * (1 - parsedDiscount / 100);
          setSalePrice(calculatedSale.toFixed(2));
        }
      } else if (salePrice) {
        const parsedSale = parseFloat(salePrice);
        if (!isNaN(parsedSale)) {
          const pct = Math.round(((parsedPrice - parsedSale) / parsedPrice) * 100);
          setDiscountPercent(pct.toString());
        }
      }
    } else {
      setSalePrice('');
      setDiscountPercent('');
    }
  };

  const handleDiscountChange = (val: string) => {
    setDiscountPercent(val);
    const parsedDiscount = parseFloat(val);
    const parsedPrice = parseFloat(price);
    if (!isNaN(parsedDiscount) && !isNaN(parsedPrice) && parsedPrice > 0) {
      if (parsedDiscount >= 0 && parsedDiscount <= 100) {
        const calculatedSale = parsedPrice * (1 - parsedDiscount / 100);
        setSalePrice(calculatedSale.toFixed(2));
      } else {
        setSalePrice('');
      }
    } else {
      setSalePrice('');
    }
  };

  const handleSalePriceChange = (val: string) => {
    setSalePrice(val);
    const parsedSale = parseFloat(val);
    const parsedPrice = parseFloat(price);
    if (!isNaN(parsedSale) && !isNaN(parsedPrice) && parsedPrice > 0) {
      if (parsedSale < parsedPrice) {
        const pct = Math.round(((parsedPrice - parsedSale) / parsedPrice) * 100);
        setDiscountPercent(pct.toString());
      } else {
        setDiscountPercent('0');
      }
    } else {
      setDiscountPercent('');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // GraphQL query strings
  const statsQueryGql = `
    query GetDashboardStats {
      dashboardStats {
        totalPatterns
        totalSales
        activeCategories
        popularCategory
        averageOrderValue
        storageProvider
      }
    }
  `;

  const productsQueryGql = `
    query GetAdminProducts {
      products {
        _id
        title
        description
        price
        salePrice
        category
        difficulty
        images
        pdfUrl
        materials
        size
        languages
        featured
      }
    }
  `;

  // Fetch metrics and list from GraphQL server
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load stats
      const statsData = await graphqlRequest(statsQueryGql);
      if (statsData.dashboardStats) {
        setStats(statsData.dashboardStats);
      }

      // Load products
      const productsData = await graphqlRequest(productsQueryGql);
      if (productsData.products) {
        setProducts(productsData.products);
      }

      // Load categories list dynamically
      const categoriesQuery = `
        query GetCategories {
          categories
        }
      `;
      const categoriesData = await graphqlRequest(categoriesQuery);
      if (categoriesData && categoriesData.categories) {
        // Merge defaults with dynamic categories to preserve defaults
        const defaults = ['amigurumi', 'clothing', 'home-decor', 'accessories', 'holiday'];
        const merged = Array.from(new Set([...defaults, ...categoriesData.categories]));
        setCategoriesList(merged);
      }

      // Load reports
      const reportsQuery = `
        query GetAdminReports {
          reports {
            _id
            name
            email
            subject
            message
            status
            createdAt
          }
        }
      `;
      const reportsData = await graphqlRequest(reportsQuery);
      if (reportsData && reportsData.reports) {
        setReports(reportsData.reports);
      }

      // Load users
      const usersQuery = `
        query GetAdminUsers {
          users {
            _id
            name
            email
            role
            createdAt
          }
        }
      `;
      try {
        const usersData = await graphqlRequest(usersQuery);
        if (usersData && usersData.users) {
          setUsersList(usersData.users);
        }
      } catch (err) {
        console.warn("Could not load users for admin dashboard:", err);
      }

      // Load campaigns history
      const campaignsQuery = `
        query GetCampaignHistory {
          campaigns {
            _id
            subject
            promoCode
            discountPercent
            message
            segment
            emailsSentCount
            sentAt
          }
        }
      `;
      try {
        const campaignsData = await graphqlRequest(campaignsQuery);
        if (campaignsData && campaignsData.campaigns) {
          setCampaignsList(campaignsData.campaigns);
        }
      } catch (err) {
        console.warn("Could not load campaigns history:", err);
      }
    } catch (err: any) {
      console.error('GraphQL loading error in Admin Panel:', err);
      setError(err.message || 'Failed to sync dashboard details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkMarketing = async () => {
    if (!promoSubject || !promoCodeInput || !promoDiscountPct || !promoMessageText) {
      showToast('Please fill out all marketing fields.', 'error');
      return;
    }

    const pct = parseInt(promoDiscountPct);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      showToast('Discount percent must be a valid integer between 1 and 100.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to broadcast this retargeting campaign email to the selected targeting segment: "${promoSegment}"?`)) {
      return;
    }

    setSendingPromo(true);
    const campaignMutation = `
      mutation SendPromoCampaign($subject: String!, $promoCode: String!, $discountPercent: Int!, $message: String!, $segment: String!) {
        sendBulkPromoEmail(subject: $subject, promoCode: $promoCode, discountPercent: $discountPercent, message: $message, segment: $segment)
      }
    `;

    try {
      const data = await graphqlRequest(campaignMutation, {
        subject: promoSubject,
        promoCode: promoCodeInput,
        discountPercent: pct,
        message: promoMessageText,
        segment: promoSegment
      });

      if (data && data.sendBulkPromoEmail !== undefined) {
        showToast(`Marketing campaign dispatched successfully to ${data.sendBulkPromoEmail} makers!`, 'success');
        setMarketingOpen(false);
        loadData(); // reload campaign log history!
      } else {
        showToast('Failed to dispatch campaign emails.', 'error');
      }
    } catch (err: any) {
      console.error("Bulk marketing campaign error:", err);
      showToast(err.message || 'Error occurred while broadcasting campaign.', 'error');
    } finally {
      setSendingPromo(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const mutation = `
        mutation ResolveReport($id: ID!) {
          resolveReport(id: $id) {
            _id
            status
          }
        }
      `;
      const data = await graphqlRequest(mutation, { id: reportId });
      if (data && data.resolveReport) {
        showToast('Report marked as resolved successfully.', 'success');
        loadData();
      } else {
        showToast('Failed to resolve report.', 'error');
      }
    } catch (err: any) {
      console.error('Error resolving report:', err);
      showToast(err.message || 'Error occurred while resolving report', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setSalePrice('');
    setCategory('amigurumi');
    setDifficulty('Beginner');
    setImages([]);
    setPdfUrl('');
    setMaterials('');
    setSize('');
    setLanguages('English');
    setFeatured(false);
    setStatusMessage(null);
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setDrawerTab('edit');
    setDiscountPercent('');
  };

  const handleOpenCreateDrawer = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const handleEditClick = (product: any) => {
    setEditingId(product._id);
    setTitle(product.title || '');
    setDescription(product.description || '');
    setPrice(product.price ? product.price.toString() : '');
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');
    const prodCat = product.category || 'amigurumi';
    if (prodCat && !categoriesList.includes(prodCat)) {
      setCategoriesList(prev => [...prev, prodCat]);
    }
    setCategory(prodCat);
    setDifficulty(product.difficulty || 'Beginner');
    setImages(Array.isArray(product.images) ? product.images : []);
    setPdfUrl(product.pdfUrl || '');
    setMaterials(Array.isArray(product.materials) ? product.materials.join(', ') : '');
    setSize(product.size || '');
    setLanguages(Array.isArray(product.languages) ? product.languages.join(', ') : 'English');
    setFeatured(!!product.featured);
    setStatusMessage(null);
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setDrawerTab('edit');
    
    // Calculate initial edit discount percentage
    const parsedPrice = parseFloat(product.price ? product.price.toString() : '0');
    const parsedSale = parseFloat(product.salePrice ? product.salePrice.toString() : '0');
    if (parsedPrice > 0 && parsedSale > 0 && parsedSale < parsedPrice) {
      const pct = Math.round(((parsedPrice - parsedSale) / parsedPrice) * 100);
      setDiscountPercent(pct.toString());
    } else {
      setDiscountPercent('');
    }

    setDrawerOpen(true);
  };

  // Image Upload handler via local uploads REST endpoint
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const resJson = await response.json();
      if (resJson.success) {
        setImages(prev => [...prev, resJson.url]);
        setStatusMessage({ type: 'success', text: `Image "${files[0].name}" uploaded.` });
      } else {
        setStatusMessage({ type: 'error', text: resJson.error || 'Upload failed' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload image' });
    } finally {
      setImageUploading(false);
    }
  };

  // PDF Upload handler
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPdfUploading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const resJson = await response.json();
      if (resJson.success) {
        setPdfUrl(resJson.url);
        setStatusMessage({ type: 'success', text: `PDF "${files[0].name}" uploaded.` });
      } else {
        setStatusMessage({ type: 'error', text: resJson.error || 'Upload failed' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to upload PDF' });
    } finally {
      setPdfUploading(false);
    }
  };

  // Submit create or edit form via GraphQL mutations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const activeCategory = isCustomCategory ? customCategoryName.trim().toLowerCase() : category;

    if (!title || !description || !price || !pdfUrl || !activeCategory) {
      setStatusMessage({ type: 'error', text: 'Missing required inputs (Title, Description, Base Price, Category, PDF File)' });
      return;
    }

    const variables = {
      title,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      category: activeCategory,
      difficulty,
      images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80"],
      pdfUrl,
      materials: materials ? materials.split(',').map(m => m.trim()).filter(Boolean) : [],
      size: size || null,
      languages: languages ? languages.split(',').map(l => l.trim()).filter(Boolean) : ['English'],
      featured
    };

    try {
      let gqlMutation = '';
      if (editingId) {
        // Edit Mutation
        gqlMutation = `
          mutation EditProduct(
            $id: ID!
            $title: String
            $description: String
            $price: Float
            $salePrice: Float
            $category: String
            $difficulty: String
            $images: [String!]
            $pdfUrl: String
            $materials: [String!]
            $size: String
            $languages: [String!]
            $featured: Boolean
          ) {
            updateProduct(
              id: $id
              title: $title
              description: $description
              price: $price
              salePrice: $salePrice
              category: $category
              difficulty: $difficulty
              images: $images
              pdfUrl: $pdfUrl
              materials: $materials
              size: $size
              languages: $languages
              featured: $featured
            ) {
              _id
            }
          }
        `;
      } else {
        // Create Mutation
        gqlMutation = `
          mutation CreateProduct(
            $title: String!
            $description: String!
            $price: Float!
            $salePrice: Float
            $category: String!
            $difficulty: String!
            $images: [String!]
            $pdfUrl: String!
            $materials: [String!]
            $size: String
            $languages: [String!]
            $featured: Boolean
          ) {
            createProduct(
              title: $title
              description: $description
              price: $price
              salePrice: $salePrice
              category: $category
              difficulty: $difficulty
              images: $images
              pdfUrl: $pdfUrl
              materials: $materials
              size: $size
              languages: $languages
              featured: $featured
            ) {
              _id
            }
          }
        `;
      }

      const params = editingId ? { id: editingId, ...variables } : variables;
      const responseData = await graphqlRequest(gqlMutation, params);
      
      if (responseData.createProduct || responseData.updateProduct) {
        setDrawerOpen(false);
        resetForm();
        loadData(); // Sync lists and calculations
        showToast(editingId ? 'Pattern changes updated successfully!' : 'New pattern published successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Mutation failed' });
    }
  };

  // Delete product Mutation
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete pattern: "${name}"?`)) return;

    const deleteMutation = `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `;

    try {
      const data = await graphqlRequest(deleteMutation, { id });
      if (data.deleteProduct) {
        loadData();
        showToast('Pattern deleted successfully.', 'success');
      } else {
        showToast('Failed to delete pattern.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Delete operation encountered an error', 'error');
    }
  };

  // Bulk deletion implementation
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedIds.length} selected patterns?`)) return;

    setLoading(true);
    const deleteMutation = `
      mutation DeleteProduct($id: ID!) {
        deleteProduct(id: $id)
      }
    `;

    try {
      // Run deletions sequentially
      for (const id of selectedIds) {
        await graphqlRequest(deleteMutation, { id });
      }
      
      setSelectedIds([]);
      await loadData();
      showToast('Selected patterns deleted successfully.', 'success');
    } catch (err: any) {
      console.error('Bulk deletion error:', err);
      showToast(err.message || 'Error occurred during bulk deletion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p._id));
    }
  };

  const handleRowCheckboxChange = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Local table search and filter computation
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || p.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="w-full flex-grow py-8 bg-[#FFFDF9] select-none text-[#5C4033] relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#EEDDCC] pb-6 gap-4">
          <div className="space-y-1">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#A855F7]"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
            </Link>
            <h1 className="font-serif font-black text-3xl sm:text-4xl tracking-tight flex items-center gap-2">
              <Settings className="w-8 h-8 text-[#A855F7] animate-spin-slow" />
              <span>Professional Dashboard</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                stats.storageProvider === 'Cloudinary CDN' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse' 
                  : 'bg-[#FFF8EF] border-[#EEDDCC] text-[#5C4033]/85'
              }`}>
                Storage CDN: {stats.storageProvider || 'Local Storage'}
              </span>
            </div>
          </div>

          <button 
            onClick={handleOpenCreateDrawer}
            className="btn-primary flex items-center gap-2 py-3 px-5 text-sm tracking-wide self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Listing</span>
          </button>
        </div>

        {/* Dashboard Analytics Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Sales */}
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Revenue</span>
                <span className="text-3xl font-black text-emerald-600">${stats.totalSales.toFixed(2)}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl text-emerald-600">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% from last month</span>
            </div>
          </div>

          {/* Card 2: Average Order */}
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Avg Order Value</span>
                <span className="text-3xl font-black">${stats.averageOrderValue.toFixed(2)}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-2xl text-amber-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold leading-none">Standard checkout value</p>
          </div>

          {/* Card 3: Catalog Stock */}
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Catalog</span>
                <span className="text-3xl font-black">{stats.totalPatterns} patterns</span>
              </div>
              <div className="bg-[#A855F7]/10 p-2.5 rounded-2xl text-[#A855F7]">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold leading-none">Instant PDF downloads online</p>
          </div>

          {/* Card 4: Best Seller */}
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Top Category</span>
                <span className="text-3xl font-black truncate max-w-[180px] block">{stats.popularCategory}</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-2xl text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold leading-none">Based on items count ({stats.activeCategories} total)</p>
          </div>

        </div>

        {/* Tab Selection */}
        <div className="border-b border-[#EEDDCC] flex gap-6">
          <button
            onClick={() => setActiveAdminTab('listings')}
            className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'listings' 
                ? 'text-[#A855F7]' 
                : 'text-[#5C4033]/60 hover:text-[#A855F7]'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Product Catalog ({products.length})</span>
            {activeAdminTab === 'listings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A855F7] rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'reports' 
                ? 'text-[#A855F7]' 
                : 'text-[#5C4033]/60 hover:text-[#A855F7]'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>User Support Tickets ({reports.filter(r => r.status === 'pending').length} pending)</span>
            {activeAdminTab === 'reports' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A855F7] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeAdminTab === 'users' 
                ? 'text-[#A855F7]' 
                : 'text-[#5C4033]/60 hover:text-[#A855F7]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Makers Registry ({usersList.length})</span>
            {activeAdminTab === 'users' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A855F7] rounded-full" />
            )}
          </button>
        </div>

        {activeAdminTab === 'listings' && (
          /* Listings Catalog Table Section */
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* Table Header Filter widgets */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#FFF8EF] pb-4 flex-wrap">
            <h3 className="font-serif font-black text-lg flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#A855F7]" />
              <span>Patterns Repository</span>
            </h3>

            {/* Filter Control Inputs */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Search patterns catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2 px-4 pl-9 text-xs text-[#1F2937] outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2 px-3 text-xs text-[#1F2937] outline-none cursor-pointer font-semibold"
              >
                <option value="all">All Categories</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2 px-3 text-xs text-[#1F2937] outline-none cursor-pointer font-semibold"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No crochet patterns found matching the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-text">
                <thead>
                  <tr className="border-b border-[#EEDDCC] text-gray-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4 text-center w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-[#EEDDCC] text-[#A855F7] focus:ring-[#A855F7] w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 font-black">Pattern details</th>
                    <th className="py-3 px-4 font-black">Category</th>
                    <th className="py-3 px-4 font-black">Difficulty</th>
                    <th className="py-3 px-4 text-right font-black">Base Price</th>
                    <th className="py-3 px-4 text-right font-black">Promo Price</th>
                    <th className="py-3 px-4 text-center font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFF8EF]">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p._id);
                    return (
                      <tr 
                        key={p._id} 
                        className={`hover:bg-[#FBF7F0]/30 transition-colors ${
                          isSelected ? 'bg-[#A855F7]/5' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRowCheckboxChange(p._id)}
                            className="rounded border-[#EEDDCC] text-[#A855F7] focus:ring-[#A855F7] w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#EEDDCC] bg-[#FBF7F0] flex-shrink-0">
                              <Image 
                                src={p.images?.[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80'} 
                                alt={p.title} 
                                fill 
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-[#5C4033] line-clamp-1">{p.title}</p>
                              {p.featured && (
                                <span className="bg-[#5C4033] text-[#FFFDF9] text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-sm mt-0.5 inline-block">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide ${
                            p.difficulty === 'Beginner' ? 'bg-green-50 text-green-700 border-green-100' :
                            p.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-gray-700">${p.price.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#A855F7]">
                          {p.salePrice ? `$${p.salePrice.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditClick(p)}
                              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Edit Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDelete(p._id, p.title)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Pattern"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}

        {activeAdminTab === 'reports' && (
          /* Reports Management Table Section */
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="font-serif font-black text-lg flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-[#A855F7]" />
              <span>User Issue Reports & Support Requests</span>
            </h3>
            
            {reports.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No user issue reports found in system. All clear!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-text">
                  <thead>
                    <tr className="border-b border-[#EEDDCC] text-gray-400 uppercase font-black tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-black">User Details</th>
                      <th className="py-3 px-4 font-black">Subject</th>
                      <th className="py-3 px-4 font-black">Description</th>
                      <th className="py-3 px-4 font-black">Submitted At</th>
                      <th className="py-3 px-4 text-center font-black">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FFF8EF]">
                    {reports.map((report) => {
                      const dateStr = report.createdAt
                        ? new Date(Number(report.createdAt) ? Number(report.createdAt) : report.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently';

                      return (
                        <tr key={report._id} className="hover:bg-[#FBF7F0]/30 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-[#5C4033]">{report.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium select-text">{report.email}</p>
                          </td>
                          <td className="py-4 px-4 font-semibold text-[#A855F7]">
                            {report.subject}
                          </td>
                          <td className="py-4 px-4 max-w-xs select-text">
                            <p className="text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">{report.message}</p>
                          </td>
                          <td className="py-4 px-4 text-gray-400 font-semibold">{dateStr}</td>
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {report.status === 'pending' ? (
                              <button
                                onClick={() => handleResolveReport(report._id)}
                                className="inline-flex items-center gap-1.5 bg-[#A855F7] hover:bg-[#9333EA] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolve</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider rounded-xl text-[9px]">
                                Resolved
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeAdminTab === 'users' && (
          <div className="bg-white border border-[#EEDDCC] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFF8EF] pb-4">
              <div className="space-y-1">
                <h3 className="font-serif font-black text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-[#A855F7]" />
                  <span>Registered Makers Registry</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">Manage all customers and trigger email marketing campaigns to drive return sales.</p>
              </div>

              <button
                onClick={() => setMarketingOpen(true)}
                className="btn-primary flex items-center gap-2 py-3 px-5 text-xs font-bold uppercase tracking-wider self-start sm:self-auto shadow-md hover:shadow-lg bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-2xl transition-all cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Retarget All Users</span>
              </button>
            </div>

            {usersList.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No registered makers found in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-text">
                  <thead>
                    <tr className="border-b border-[#EEDDCC] text-gray-400 uppercase font-black tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 font-black">User Details</th>
                      <th className="py-3.5 px-4 font-black">System Role</th>
                      <th className="py-3.5 px-4 font-black">Account Email</th>
                      <th className="py-3.5 px-4 font-black">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FFF8EF]">
                    {usersList.map((user) => {
                      const dateStr = user.createdAt
                        ? new Date(Number(user.createdAt) ? Number(user.createdAt) : user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recently';

                      return (
                        <tr key={user._id} className="hover:bg-[#FBF7F0]/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-[#5C4033]">{user.name}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                              user.role === 'admin' 
                                ? 'bg-[#A855F7]/10 border-[#A855F7]/20 text-[#A855F7]' 
                                : 'bg-[#FFF8EF] border-[#EEDDCC] text-[#5C4033]/85'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 font-semibold">{user.email}</td>
                          <td className="py-4 px-4 text-gray-400 font-semibold">{dateStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Campaign Broadcast Logs */}
            <div className="border-t border-[#FFF8EF] pt-8 space-y-4">
              <div className="space-y-1">
                <h3 className="font-serif font-black text-lg flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#A855F7]" />
                  <span>Campaign Dispatch Logs & Analytics</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">Review history and analytics of sent email retargeting campaigns.</p>
              </div>

              {campaignsList.length === 0 ? (
                <div className="text-center py-10 bg-[#FBF7F0]/30 rounded-2xl border border-dashed border-[#EEDDCC] text-gray-400 text-xs">
                  No campaigns dispatched yet. Click "Retarget All Users" to start!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-text">
                    <thead>
                      <tr className="border-b border-[#EEDDCC] text-gray-400 uppercase font-black tracking-wider text-[10px]">
                        <th className="py-3 px-4 font-black">Campaign Subject / Code</th>
                        <th className="py-3 px-4 font-black">Target Segment</th>
                        <th className="py-3 px-4 text-center font-black">Audience Size</th>
                        <th className="py-3 px-4 font-black">Dispatch Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#FFF8EF]">
                      {campaignsList.map((camp) => {
                        const dateStr = camp.sentAt
                          ? new Date(Number(camp.sentAt) ? Number(camp.sentAt) : camp.sentAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Recently';

                        return (
                          <tr key={camp._id} className="hover:bg-[#FBF7F0]/30 transition-colors">
                            <td className="py-4 px-4">
                              <p className="font-bold text-[#5C4033]">{camp.subject}</p>
                              <p className="text-[10px] font-mono font-bold text-[#A855F7] mt-0.5 uppercase">
                                Code: {camp.promoCode} ({camp.discountPercent}% OFF)
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                                camp.segment === 'vips' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                camp.segment === 'purchasers' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                camp.segment === 'non-purchasers' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                                'bg-gray-50 border-gray-200 text-gray-700'
                              }`}>
                                {camp.segment === 'vips' ? '⭐ VIP Customers (3+ Orders)' :
                                 camp.segment === 'purchasers' ? '🛒 Active Buyers (1+ Orders)' :
                                 camp.segment === 'non-purchasers' ? '🌸 Leads (0 Orders)' :
                                 '📢 Broadcast (All)'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center font-black text-emerald-600">
                              {camp.emailsSentCount} users emailed
                            </td>
                            <td className="py-4 px-4 text-gray-400 font-semibold">{dateStr}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Floating Bulk Actions Bottom Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#5C4033] text-[#FFFDF9] py-3.5 px-6 rounded-2xl shadow-xl flex items-center gap-6 border border-[#6E4F41] animate-bounce-short">
          <span className="text-xs font-bold font-sans">
            {selectedIds.length} patterns selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-300 hover:text-white font-semibold"
            >
              Cancel Selection
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Sliding Right-Side Form Drawer Panel */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setDrawerOpen(false)} />
        
        {/* Drawer Body */}
        <div className={`relative w-full max-w-xl h-full bg-[#FFFDF9] shadow-2xl flex flex-col z-10 border-l border-[#EEDDCC] transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#EEDDCC] bg-[#FBF7F0]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Catalog Editor</span>
              <h2 className="font-serif font-black text-xl flex items-center gap-1.5 leading-none">
                <Sparkles className="w-5 h-5 text-[#A855F7]" />
                <span>{editingId ? 'Modify Pattern Details' : 'Add Pattern Listing'}</span>
              </h2>
            </div>
            <button 
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 hover:bg-[#EEDDCC] rounded-full text-gray-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Editor/Preview Tab Bar */}
          <div className="flex border-b border-[#EEDDCC] bg-white z-30">
            <button
              type="button"
              onClick={() => setDrawerTab('edit')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                drawerTab === 'edit'
                  ? 'border-[#A855F7] text-[#A855F7] bg-[#A855F7]/5'
                  : 'border-transparent text-gray-500 hover:text-[#A855F7] bg-white'
              }`}
            >
              Form Editor
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('preview')}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all ${
                drawerTab === 'preview'
                  ? 'border-[#A855F7] text-[#A855F7] bg-[#A855F7]/5'
                  : 'border-transparent text-gray-500 hover:text-[#A855F7] bg-white'
              }`}
            >
              Card Live Preview
            </button>
          </div>

          {/* Drawer Form Body Wrapper */}
          <div className="flex-grow relative overflow-hidden flex flex-col">
            {drawerTab === 'preview' && (
              <div className="absolute inset-0 bg-[#FFFDF9] z-20 overflow-y-auto p-8 flex flex-col items-center justify-center space-y-6 animate-fadeIn">
                <div className="w-full max-w-xs">
                  <ProductCard 
                    product={{
                      _id: editingId || 'preview-temp-id',
                      title: title || 'Pattern Title Preview',
                      description: description || 'No description provided yet.',
                      price: parseFloat(price) || 0.00,
                      salePrice: salePrice ? parseFloat(salePrice) : undefined,
                      category: isCustomCategory ? customCategoryName || 'amigurumi' : category,
                      difficulty: difficulty || 'Beginner',
                      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80'],
                      pdfUrl: pdfUrl || '/uploads/mock-pattern.pdf',
                      featured: featured
                    }} 
                  />
                </div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider text-center max-w-xs leading-normal">
                  This is a live preview of how the pattern card will look on the storefront listings catalog.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Section 1: General Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-[#A855F7] border-b border-[#FFF8EF] pb-1.5 tracking-wider">1. General Information</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Pattern Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Giraffe Crochet Pattern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Collection Category *</label>
                  <select
                    value={category === 'custom' ? 'custom' : category}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCategory(val);
                      if (val === 'custom') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                      }
                    }}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none cursor-pointer font-semibold"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                    <option value="custom">+ Add Custom Category...</option>
                  </select>

                  {isCustomCategory && (
                    <div className="space-y-1 mt-2 animate-fadeIn">
                      <label className="text-[10px] font-bold uppercase text-[#A855F7]">New Category Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. toys"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2 px-3 text-xs text-[#1F2937] outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain pattern details, skill levels, stitching methods, and row counts..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Section 2: Pricing */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-[#A855F7] border-b border-[#FFF8EF] pb-1.5 tracking-wider">2. Pricing Scheme</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="7.99"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    value={discountPercent}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Promo Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="4.99"
                    value={salePrice}
                    onChange={(e) => handleSalePriceChange(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Skill Level *</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none cursor-pointer font-semibold"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Material specs */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-[#A855F7] border-b border-[#FFF8EF] pb-1.5 tracking-wider">3. Technical Specifications</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold uppercase">Required Materials (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.5mm hook, worsted yarn, stuffing"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Finished Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 20cm height"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Media uploads */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-[#A855F7] border-b border-[#FFF8EF] pb-1.5 tracking-wider">4. Pattern Assets Upload</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Images */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase block">Product Image *</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                  <button
                    type="button"
                    disabled={imageUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border border-dashed border-[#EEDDCC] hover:border-[#A855F7] hover:bg-[#FBF7F0]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white text-gray-400 disabled:opacity-55"
                  >
                    {imageUploading ? (
                      <div className="w-5 h-5 border-2 border-[#A855F7]/20 border-t-[#A855F7] rounded-full animate-spin" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-[#A855F7]" />
                    )}
                    <span className="text-[11px] font-semibold">
                      {imageUploading ? 'Uploading Image...' : 'Click to Upload Image'}
                    </span>
                  </button>

                  {/* Thumbnail list */}
                  {images.length > 0 && (
                    <div className="flex gap-2 flex-wrap pt-1">
                      {images.map((url, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-lg border border-[#EEDDCC] overflow-hidden">
                          <Image src={url} alt={`preview ${idx}`} fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-[#A855F7] text-white rounded-full p-0.5 hover:bg-[#9333EA] transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* PDF file */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase block">Instructions PDF Pattern *</span>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    ref={pdfInputRef} 
                    className="hidden" 
                    onChange={handlePdfUpload} 
                  />
                  <button
                    type="button"
                    disabled={pdfUploading}
                    onClick={() => pdfInputRef.current?.click()}
                    className="w-full border border-dashed border-[#EEDDCC] hover:border-[#A855F7] hover:bg-[#FBF7F0]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white text-gray-400 disabled:opacity-55"
                  >
                    {pdfUploading ? (
                      <div className="w-5 h-5 border-2 border-[#A855F7]/20 border-t-[#A855F7] rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-7 h-7 text-[#A855F7]" />
                    )}
                    <span className="text-[11px] font-semibold">
                      {pdfUploading ? 'Uploading PDF...' : 'Click to Upload PDF'}
                    </span>
                  </button>

                  {pdfUrl && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 px-3 flex items-center justify-between text-[11px] text-emerald-800 font-semibold mt-1">
                      <span className="truncate max-w-[180px]">{pdfUrl.split('/').pop()}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Featured toggle & Language spec */}
            <div className="border-t border-[#EEDDCC] pt-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured-drawer"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#A855F7] border-[#EEDDCC] rounded accent-[#A855F7]"
                />
                <label htmlFor="featured-drawer" className="text-xs font-bold uppercase select-none cursor-pointer">
                  Feature Pattern in Hero Sections
                </label>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <span className="font-bold uppercase text-gray-400 text-[10px]">Languages:</span>
                <input 
                  type="text" 
                  value={languages} 
                  onChange={(e) => setLanguages(e.target.value)}
                  className="bg-[#FBF7F0] border border-[#EEDDCC] rounded-lg py-1 px-2 text-xs w-28 text-[#1F2937]" 
                />
              </div>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl text-xs font-semibold ${
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
              }`}>
                {statusMessage.text}
              </div>
            )}

          </form>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-5 border-t border-[#EEDDCC] bg-[#FBF7F0] flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="btn-secondary text-xs py-2.5"
            >
              Cancel Edit
            </button>
            
            <button
              onClick={handleSubmit}
              className="btn-primary text-xs py-2.5 px-6 shadow-md"
            >
              {editingId ? 'Save Updates' : 'Publish Pattern'}
            </button>
          </div>

        </div>

      </div>
      {/* Retargeting Marketing Drawer */}
      <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        marketingOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}>
        {/* Backdrop */}
        <div 
          onClick={() => setMarketingOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        />
        
        {/* Drawer Panel */}
        <div className={`absolute inset-y-0 right-0 w-full max-w-lg h-full bg-[#FFFDF9] shadow-2xl flex flex-col z-10 border-l border-[#EEDDCC] transform transition-transform duration-300 ease-in-out ${
          marketingOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#EEDDCC] bg-[#FBF7F0]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Marketing Campaign Manager</span>
              <h2 className="font-serif font-black text-xl flex items-center gap-1.5 leading-none">
                <Megaphone className="w-5 h-5 text-[#A855F7]" />
                <span>Retarget Registered Makers</span>
              </h2>
            </div>
            <button 
              onClick={() => setMarketingOpen(false)}
              className="p-1.5 hover:bg-[#EEDDCC] rounded-full text-gray-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Drawer Body Form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <p className="text-xs text-gray-500 leading-relaxed bg-purple-50 text-[#A855F7] p-3.5 rounded-xl border border-purple-100/50">
              💡 **Email Marketing Retargeting Campaign:** This utility dispatches a customized promo discount email to a segmented audience of registered makers in Yarn Craft Co.
            </p>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#5C4033] block">Quick Campaign Templates</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPromoSubject('🧶 VIP Member Reward: 30% OFF Your Next Pattern!');
                    setPromoCodeInput('VIPLOYAL30');
                    setPromoDiscountPct('30');
                    setPromoMessageText('We want to say a huge thank you for your continued support! As a VIP maker at Yarn Craft Co, here is an exclusive 30% discount on any new digital pattern in our catalog. Start your next project today!');
                    setPromoSegment('vips');
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  ⭐ VIP Appreciation (30% OFF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromoSubject('🌸 Start Crocheting! Get 25% OFF Your First Pattern!');
                    setPromoCodeInput('STARTCRAFT25');
                    setPromoDiscountPct('25');
                    setPromoMessageText('Ready to start your next creative project? Claim 25% off your very first pattern from our premium catalog. Download instantly, pick up your hooks, and get stitching!');
                    setPromoSegment('non-purchasers');
                  }}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  🌸 Welcome Conversion (25% OFF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromoSubject('⛄ Cozy Maker Special: 15% OFF All Patterns!');
                    setPromoCodeInput('COZYSTITCH15');
                    setPromoDiscountPct('15');
                    setPromoMessageText('Warm up this season with our cozy crochet patterns. Claim 15% off any listing in our shop and download immediately to start stitching today.');
                    setPromoSegment('all');
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  ⛄ Seasonal Stitch (15% OFF)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[#5C4033]">Targeting Segment *</label>
              <select
                value={promoSegment}
                onChange={(e: any) => setPromoSegment(e.target.value)}
                className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none cursor-pointer font-semibold animate-fadeIn"
              >
                <option value="all">📢 Broadcast (All Registered Users)</option>
                <option value="non-purchasers">🌸 Leads (Users with 0 Purchases)</option>
                <option value="purchasers">🛒 Active Buyers (Users with 1+ Purchases)</option>
                <option value="vips">⭐ VIP Customers (Users with 3+ Purchases)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[#5C4033]">Email Subject *</label>
              <input
                type="text"
                required
                value={promoSubject}
                onChange={(e) => setPromoSubject(e.target.value)}
                placeholder="🧶 Exclusive Offer from Yarn Craft Co!"
                className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#5C4033]">Promo Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  placeholder="MAKER20"
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none font-mono font-bold tracking-wider"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#5C4033]">Discount Value (%) *</label>
                <input
                  type="number"
                  required
                  value={promoDiscountPct}
                  onChange={(e) => setPromoDiscountPct(e.target.value)}
                  placeholder="20"
                  className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-[#5C4033]">Retargeting Message *</label>
              <textarea
                required
                rows={6}
                value={promoMessageText}
                onChange={(e) => setPromoMessageText(e.target.value)}
                placeholder="Write your email body copy..."
                className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-5 border-t border-[#EEDDCC] bg-[#FBF7F0] flex gap-3 justify-end">
            <button
              onClick={() => setMarketingOpen(false)}
              className="btn-secondary text-xs py-2.5"
              disabled={sendingPromo}
            >
              Close
            </button>
            <button
              onClick={handleSendBulkMarketing}
              className="btn-primary text-xs py-2.5 px-6 shadow-md bg-[#A855F7] hover:bg-[#9333EA] text-white flex items-center gap-1.5 cursor-pointer"
              disabled={sendingPromo}
            >
              {sendingPromo ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching Emails...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Campaign Email</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
