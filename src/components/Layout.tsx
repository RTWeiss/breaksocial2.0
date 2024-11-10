import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, Mail, User, LogOut, Package, X, PenSquare, Menu } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNotificationsStore } from '../store/notificationsStore';
import { supabase } from '../lib/supabase';
import TrendingSection from './TrendingSection';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, signOut } = useAuthStore();
  const { unreadCount, subscribeToNotifications } = useNotificationsStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'mint',
    image_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToNotifications();
      return () => unsubscribe();
    }
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      const price = parseFloat(listingData.price);
      
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      const { error } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          title: listingData.title,
          description: listingData.description + ' #marketplace',
          price,
          condition: listingData.condition,
          image_url: listingData.image_url,
          status: 'active',
        });

      if (error) throw error;

      toast.success('Listing created successfully!');
      setIsListingModalOpen(false);
      setListingData({
        title: '',
        description: '',
        price: '',
        condition: 'mint',
        image_url: '',
      });
      navigate('/marketplace');
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Marketplace', href: '/marketplace', icon: Package },
    { name: 'Explore', href: '/explore', icon: Search },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { name: 'Messages', href: '/messages', icon: Mail },
    { name: 'Profile', href: `/profile/${user?.id}`, icon: User },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto flex relative">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-gray-800 px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-900 rounded-full"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
              Break
            </span>
          </Link>
          <div className="w-6" /> {/* Spacer for alignment */}
        </header>

        {/* Mobile Navigation Drawer */}
        <div
          className={`lg:hidden fixed inset-0 z-40 transform ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-200 ease-in-out`}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="relative w-64 max-w-sm bg-black h-full border-r border-gray-800">
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-6">
                <Link to="/" className="flex items-center space-x-2">
                  <Package className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                    Break
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-900 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-full hover:bg-gray-900 transition ${
                      location.pathname === item.href ? 'font-bold bg-gray-900' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-6 h-6" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-full hover:bg-gray-900 transition text-left"
                >
                  <LogOut className="w-6 h-6" />
                  <span>Logout</span>
                </button>
              </div>

              <div className="mt-auto space-y-2">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-purple-600 text-white rounded-full py-3 px-8 font-bold hover:bg-purple-700 transition"
                >
                  Post
                </button>
                <button
                  onClick={() => setIsListingModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full py-3 px-8 font-bold hover:opacity-90 transition"
                >
                  List Item
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-20 xl:w-64 fixed h-screen border-r border-gray-800 z-20 bg-black">
          <div className="flex flex-col h-full p-2 xl:p-4">
            <Link to="/" className="mb-4 flex justify-center xl:justify-start">
              <div className="flex items-center space-x-2">
                <Package className="w-8 h-8 text-purple-500" />
                <span className="hidden xl:inline text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
                  Break
                </span>
              </div>
            </Link>
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-full hover:bg-gray-900 transition ${
                    location.pathname === item.href ? 'font-bold' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-6 h-6" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-3 px-4 py-3 rounded-full hover:bg-gray-900 transition w-full text-left"
              >
                <LogOut className="w-6 h-6" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </nav>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-purple-600 text-white rounded-full py-3 px-4 xl:px-8 font-bold hover:bg-purple-700 transition flex items-center justify-center space-x-2"
              >
                <PenSquare className="w-5 h-5 xl:hidden" />
                <span className="hidden xl:inline">Post</span>
              </button>
              <button
                onClick={() => setIsListingModalOpen(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full py-3 px-4 xl:px-8 font-bold hover:opacity-90 transition flex items-center justify-center space-x-2"
              >
                <Package className="w-5 h-5 xl:hidden" />
                <span className="hidden xl:inline">List Item</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-20 xl:ml-64 min-h-screen border-r border-gray-800 mt-14 lg:mt-0">
          <div className="max-w-2xl">
            <Outlet />
          </div>
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="fixed w-80 h-screen p-4 overflow-y-auto">
            <TrendingSection />
          </div>
        </aside>
      </div>

      {/* List Item Modal */}
      {isListingModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Listing</h2>
              <button
                onClick={() => setIsListingModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={listingData.title}
                  onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={listingData.description}
                  onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={listingData.price}
                    onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Condition
                </label>
                <select
                  value={listingData.condition}
                  onChange={(e) => setListingData({ ...listingData, condition: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  required
                >
                  <option value="mint">Mint</option>
                  <option value="near_mint">Near Mint</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Image
                </label>
                <ImageUpload
                  onUpload={(url) => setListingData({ ...listingData, image_url: url })}
                  folder="listings"
                  currentImage={listingData.image_url}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsListingModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}