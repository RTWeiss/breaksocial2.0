import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import ImagePreview from '../components/ImagePreview';
import UserAvatar from '../components/UserAvatar';
import MakeOfferModal from '../components/MakeOfferModal';
import EditListingModal from '../components/EditListingModal';
import LikeListingButton from '../components/LikeListingButton';
import toast from 'react-hot-toast';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  image_url: string | null;
  seller_id: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  likes: { user_id: string }[];
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          likes:listing_likes (
            user_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!listing || !window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast.success('Listing deleted successfully');
      navigate('/marketplace');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Listing not found</h3>
          <Link
            to="/marketplace"
            className="text-purple-500 hover:text-purple-400 inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.seller_id;
  const likesCount = Array.isArray(listing.likes) ? listing.likes.length : 0;
  const isLiked = user ? listing.likes?.some(like => like.user_id === user.id) ?? false : false;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/marketplace"
          className="inline-flex items-center text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Marketplace
        </Link>

        {isOwner && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="aspect-w-16 aspect-h-9">
          <ImagePreview
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-96"
            objectFit="contain"
            fallbackText={listing.title}
          />
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              to={`/profile/${listing.seller_id}`}
              className="flex items-center space-x-3"
            >
              <UserAvatar
                userId={listing.seller_id}
                username={listing.profiles.username}
                avatarUrl={listing.profiles.avatar_url}
              />
              <div>
                <h3 className="font-semibold text-white">
                  {listing.profiles.full_name || listing.profiles.username}
                </h3>
                <p className="text-gray-400 text-sm">@{listing.profiles.username}</p>
              </div>
            </Link>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">${listing.price}</p>
              <p className="text-gray-400 text-sm">
                Listed {new Date(listing.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">{listing.title}</h1>
          <p className="text-gray-300 mb-6 whitespace-pre-wrap">{listing.description}</p>

          <div className="flex items-center justify-between mb-6">
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
              {listing.condition.replace('_', ' ').toUpperCase()}
            </span>
            <LikeListingButton
              listingId={listing.id}
              isLiked={isLiked}
              likesCount={likesCount}
              onLike={fetchListing}
            />
          </div>

          {!isOwner && (
            <div className="flex space-x-4">
              <button
                onClick={() => setIsOfferModalOpen(true)}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2"
              >
                <span>Make Offer</span>
              </button>
              <Link
                to={`/messages?seller=${listing.seller_id}&listing=${listing.id}`}
                className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition flex items-center justify-center space-x-2"
              >
                <span>Message Seller</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {isOfferModalOpen && (
        <MakeOfferModal
          listing={listing}
          onClose={() => setIsOfferModalOpen(false)}
        />
      )}

      {isEditModalOpen && (
        <EditListingModal
          listing={listing}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={fetchListing}
        />
      )}
    </div>
  );
}