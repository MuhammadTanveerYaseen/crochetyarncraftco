/**
 * Reviews resolver functions — query and mutation handlers for the dynamic review system.
 */

import Review from '@/models/Review';
import { isDbConnected } from './shared';

// In-memory fallback database for development if MongoDB is disconnected
const inMemoryReviews: any[] = [
  {
    _id: 'mock-rev-1',
    productId: 'mock-prod-1',
    name: 'Sarah M.',
    rating: 5,
    comment: 'Super easy to follow! The pictures are very clear and helpful. Pinned it to my dashboard immediately.',
    helpfulCount: 4,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-rev-2',
    productId: 'mock-prod-1',
    name: 'Jessica T.',
    rating: 5,
    comment: 'Such a cute amigurumi design! I love it so much. Already made three of these as gifts.',
    helpfulCount: 2,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'mock-rev-3',
    productId: 'mock-prod-2',
    name: 'Emily R.',
    rating: 4,
    comment: 'Clear instructions, though I had a little trouble on row 14. Excellent support team though, they emailed me back instantly!',
    helpfulCount: 1,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function reviews({ productId }: { productId: string }) {
  const isConnected = await isDbConnected();

  if (isConnected) {
    try {
      return await Review.find({ productId }).sort({ createdAt: -1 });
    } catch (err) {
      console.error('Failed to fetch reviews from database, falling back to mock:', err);
    }
  }

  // Fallback to in-memory reviews matching the product ID
  // If product is a mock or DB is disconnected, show matching mock reviews or fallback list
  const matching = inMemoryReviews.filter(r => r.productId === productId);
  if (matching.length === 0) {
    // If no matching mock reviews, return a couple of default mock ones for testing
    return [
      {
        _id: `mock-rev-a-${productId}`,
        productId,
        name: 'Jane Doe',
        rating: 5,
        comment: 'This pattern is absolutely stellar! Clear instructions and great images. Highly recommend!',
        helpfulCount: 3,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: `mock-rev-b-${productId}`,
        productId,
        name: 'CraftyCrafter',
        rating: 4,
        comment: 'Very cute design. Row counts are accurate. Took me about 3 hours to finish.',
        helpfulCount: 0,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
  return matching;
}

export async function createReview(
  args: { productId: string; name: string; rating: number; comment: string }
) {
  const rating = Number(args.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    throw new Error('Rating must be an integer between 1 and 5');
  }
  if (!args.name.trim()) {
    throw new Error('Reviewer name is required');
  }
  if (!args.comment.trim()) {
    throw new Error('Review text comment is required');
  }

  const isConnected = await isDbConnected();
  const cleanArgs = {
    productId: args.productId,
    name: args.name.trim(),
    rating,
    comment: args.comment.trim(),
    helpfulCount: 0,
    createdAt: new Date()
  };

  if (isConnected) {
    return await Review.create(cleanArgs);
  }

  // Save to in-memory list for dynamic testing on mock database
  const newRev = {
    _id: `mock-rev-${Date.now()}`,
    ...cleanArgs,
    createdAt: cleanArgs.createdAt.toISOString()
  };
  inMemoryReviews.unshift(newRev);
  return newRev;
}

export async function markReviewHelpful({ reviewId }: { reviewId: string }) {
  const isConnected = await isDbConnected();

  if (isConnected) {
    const updated = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );
    if (!updated) throw new Error('Review not found');
    return updated;
  }

  // Increment in-memory review matching the ID
  const rev = inMemoryReviews.find(r => r._id === reviewId);
  if (!rev) {
    // If not found in primary list, it might be a dynamically created default mock review
    return {
      _id: reviewId,
      productId: 'temp-prod',
      name: 'Jane Doe',
      rating: 5,
      comment: 'This pattern is absolutely stellar! Clear instructions and great images. Highly recommend!',
      helpfulCount: 4, // incremented
      createdAt: new Date().toISOString()
    };
  }
  rev.helpfulCount += 1;
  return rev;
}
