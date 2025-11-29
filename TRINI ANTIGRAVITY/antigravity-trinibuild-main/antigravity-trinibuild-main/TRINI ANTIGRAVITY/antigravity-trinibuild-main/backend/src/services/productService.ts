import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ProductService = {
  // Get all products with filtering
  async getProducts(filters: any = {}, limit: number = 20, offset: number = 0) {
    const where: any = { isActive: true };

    if (filters.category) where.category = filters.category;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.minPrice) where.price = { gte: filters.minPrice };
    if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice };
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: filters.sortBy === 'price' 
        ? { price: 'asc' }
        : filters.sortBy === 'newest'
        ? { createdAt: 'desc' }
        : { rating: 'desc' }
    });

    const total = await prisma.product.count({ where });

    return { products, total };
  },

  // Get product by ID
  async getProduct(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (product) {
      // Increment views
      await prisma.product.update({
        where: { id: productId },
        data: { views: { increment: 1 } }
      });
    }

    return product;
  },

  // Create product (vendor)
  async createProduct(vendorId: string, productData: any) {
    return prisma.product.create({
      data: {
        ...productData,
        vendorId,
        slug: productData.title.toLowerCase().replace(/\s+/g, '-')
      }
    });
  },

  // Update product (vendor)
  async updateProduct(productId: string, productData: any) {
    return prisma.product.update({
      where: { id: productId },
      data: productData
    });
  },

  // Delete product (vendor)
  async deleteProduct(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { isActive: false }
    });
  },

  // Get featured products
  async getFeaturedProducts(limit: number = 8) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true
      },
      take: limit,
      orderBy: { rating: 'desc' }
    });
  },

  // Get flash sale products
  async getFlashSaleProducts(limit: number = 20) {
    const now = new Date();
    return prisma.product.findMany({
      where: {
        isActive: true,
        isFlashSale: true,
        flashSaleEndDate: { gt: now }
      },
      take: limit,
      orderBy: { discount: 'desc' }
    });
  },

  // Update product views
  async incrementViews(productId: string) {
    return prisma.product.update({
      where: { id: productId },
      data: { views: { increment: 1 } }
    });
  },

  // Search products
  async searchProducts(query: string, limit: number = 20) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      },
      take: limit
    });
  }
};
