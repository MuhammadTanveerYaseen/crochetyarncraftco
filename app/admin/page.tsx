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
  LifeBuoy
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { graphqlRequest } from '@/lib/graphqlClient';
import { useCart } from '@/context/CartContext';

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
  
  const [activeAdminTab, setActiveAdminTab] = useState<'listings' | 'reports'>('listings');
  const [reports, setReports] = useState<any[]>([]);
  
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
    } catch (err: any) {
      console.error('GraphQL loading error in Admin Panel:', err);
      setError(err.message || 'Failed to sync dashboard details');
    } finally {
      setLoading(false);
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
  };

  const handleOpenCreateDrawer = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const handleEditClick = (product: any) => {
    setEditingId(product._id);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price.toString());
    setSalePrice(product.salePrice ? product.salePrice.toString() : '');
    setCategory(product.category);
    setDifficulty(product.difficulty);
    setImages(product.images);
    setPdfUrl(product.pdfUrl);
    setMaterials(product.materials ? product.materials.join(', ') : '');
    setSize(product.size || '');
    setLanguages(product.languages ? product.languages.join(', ') : 'English');
    setFeatured(!!product.featured);
    setStatusMessage(null);
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

    if (!title || !description || !price || !pdfUrl) {
      setStatusMessage({ type: 'error', text: 'Missing required inputs (Title, Description, Base Price, PDF File)' });
      return;
    }

    const variables = {
      title,
      description,
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      category,
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
        </div>

        {activeAdminTab === 'listings' ? (
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
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#FBF7F0] border border-[#EEDDCC] text-xs font-semibold rounded-xl py-2 px-3 pl-9 outline-none focus:border-[#A855F7] w-full text-[#1F2937]"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#5C4033]" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-[#EEDDCC] text-xs font-semibold rounded-xl py-2 px-3 pr-8 outline-none focus:border-[#A855F7] cursor-pointer"
                >
                  <option value="all">Category: All</option>
                  <option value="amigurumi">Amigurumi</option>
                  <option value="clothing">Clothing</option>
                  <option value="home-decor">Home Decor</option>
                  <option value="accessories">Accessories</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>

              {/* Difficulty filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="bg-white border border-[#EEDDCC] text-xs font-semibold rounded-xl py-2 px-3 pr-8 outline-none focus:border-[#A855F7] cursor-pointer"
              >
                <option value="all">Difficulty: All</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Catalog Listing Table Output */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500 font-semibold flex items-center justify-center gap-2 bg-red-50 border border-red-100 rounded-2xl">
              <AlertTriangle className="w-5 h-5" />
              <span>Error Syncing: {error}</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              No matching listings found. Try adjusting filters or search queries.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#EEDDCC]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FBF7F0] border-b border-[#EEDDCC] text-[#5C4033] font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-[#A855F7] border-[#EEDDCC] rounded accent-[#A855F7]"
                      />
                    </th>
                    <th className="py-4 px-4">Pattern Details</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Difficulty</th>
                    <th className="py-4 px-4 text-right">Price</th>
                    <th className="py-4 px-4 text-right">Sale Price</th>
                    <th className="py-4 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFF8EF]">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p._id);
                    return (
                      <tr 
                        key={p._id} 
                        className={`transition-colors ${
                          isSelected ? 'bg-[#A855F7]/5' : 'hover:bg-[#FBF7F0]/40'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRowCheckboxChange(p._id)}
                            className="w-4 h-4 text-[#A855F7] border-[#EEDDCC] rounded accent-[#A855F7]"
                          />
                        </td>
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-[#EEDDCC] bg-gray-50 flex-shrink-0">
                            <Image
                              src={p.images[0] || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80'}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-[#5C4033] block truncate max-w-[280px]">
                              {p.title}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate max-w-[280px] font-semibold mt-0.5">
                              {p.pdfUrl.split('/').pop()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 capitalize font-semibold text-gray-500">{p.category}</td>
                        <td className="py-3.5 px-4">
                          <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] border ${
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
                        <td className="py-3.5 px-4">
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
        ) : (
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
              <div className="overflow-x-auto rounded-2xl border border-[#EEDDCC]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FBF7F0] border-b border-[#EEDDCC] text-[10px] text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-4 font-bold">Reporter</th>
                      <th className="py-4 px-4 font-bold">Topic</th>
                      <th className="py-4 px-4 font-bold">Message</th>
                      <th className="py-4 px-4 font-bold">Submitted</th>
                      <th className="py-4 px-4 font-bold text-center">Status / Actions</th>
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

          {/* Drawer Form Body */}
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
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus:border-[#A855F7] rounded-xl py-2.5 px-4 text-xs text-[#1F2937] outline-none cursor-pointer font-semibold"
                  >
                    <option value="amigurumi">Amigurumi Plushies</option>
                    <option value="clothing">Clothing & Fashion</option>
                    <option value="home-decor">Home Decor & Throw Blankets</option>
                    <option value="accessories">Accessories & Bags</option>
                    <option value="holiday">Holiday Bundle Specials</option>
                  </select>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="7.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
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
                    onChange={(e) => setSalePrice(e.target.value)}
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
    </div>
  );
}
