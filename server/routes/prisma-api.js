import express from 'express';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Test endpoint
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Prisma API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all materials
router.get('/materials', async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      include: {
        inventoryItems: {
          select: {
            quantity: true,
            location: true
          }
        }
      }
    });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        processSelections: {
          include: {
            sequence: {
              include: {
                steps: {
                  orderBy: {
                    stepNumber: 'asc'
                  }
                }
              }
            }
          }
        },
        inventoryItems: true
      }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new product
router.post('/products', async (req, res) => {
  try {
    const { name, description, sku, categoryId, brand, gsm, fscCertified, basePrice } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        categoryId: parseInt(categoryId),
        brand,
        gsm: gsm ? parseFloat(gsm) : null,
        fscCertified: Boolean(fscCertified),
        basePrice: parseFloat(basePrice)
      },
      include: {
        category: true
      }
    });

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        jobCards: {
          select: {
            id: true,
            jobNumber: true,
            status: true
          }
        }
      }
    });
    res.json({ success: true, data: companies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all process sequences
router.get('/process-sequences', async (req, res) => {
  try {
    const sequences = await prisma.processSequence.findMany({
      include: {
        steps: {
          orderBy: {
            stepNumber: 'asc'
          }
        },
        productSelections: {
          include: {
            product: true
          }
        }
      }
    });
    res.json({ success: true, data: sequences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all job cards
router.get('/job-cards', async (req, res) => {
  try {
    const jobCards = await prisma.jobCard.findMany({
      include: {
        company: true,
        product: {
          include: {
            category: true
          }
        },
        sequence: {
          include: {
            steps: {
              orderBy: {
                stepNumber: 'asc'
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        lifecycles: {
          include: {
            processStep: true,
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ success: true, data: jobCards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new job card
router.post('/job-cards', async (req, res) => {
  try {
    const {
      jobNumber,
      companyId,
      productId,
      sequenceId,
      quantity,
      urgency,
      dueDate,
      notes,
      createdById
    } = req.body;

    // Get product price for total cost calculation
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    const jobCard = await prisma.jobCard.create({
      data: {
        jobNumber,
        companyId: parseInt(companyId),
        productId: parseInt(productId),
        sequenceId: parseInt(sequenceId),
        quantity: parseInt(quantity),
        urgency: urgency || 'NORMAL',
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        totalCost: product ? product.basePrice * parseInt(quantity) : 0,
        notes,
        createdById: parseInt(createdById)
      },
      include: {
        company: true,
        product: {
          include: {
            category: true
          }
        },
        sequence: {
          include: {
            steps: {
              orderBy: {
                stepNumber: 'asc'
              }
            }
          }
        },
        createdBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({ success: true, data: jobCard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get inventory
router.get('/inventory', async (req, res) => {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        },
        material: true,
        logs: {
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Last 5 logs
        }
      }
    });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalProducts,
      totalMaterials,
      totalCompanies,
      totalUsers,
      totalJobCards,
      pendingJobs,
      inProgressJobs,
      completedJobs
    ] = await Promise.all([
      prisma.product.count(),
      prisma.material.count(),
      prisma.company.count(),
      prisma.user.count(),
      prisma.jobCard.count(),
      prisma.jobCard.count({ where: { status: 'PENDING' } }),
      prisma.jobCard.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.jobCard.count({ where: { status: 'COMPLETED' } })
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        totalMaterials,
        totalCompanies,
        totalUsers,
        totalJobCards,
        jobsByStatus: {
          pending: pendingJobs,
          inProgress: inProgressJobs,
          completed: completedJobs
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;