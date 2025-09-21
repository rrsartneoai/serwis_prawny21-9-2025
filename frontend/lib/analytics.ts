// Google Analytics 4 Integration for AI Prawnik PL
// Based on blueprint:javascript_google_analytics integration

// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: NEXT_PUBLIC_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);

  console.log('Google Analytics initialized with ID:', measurementId);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events for legal services
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Specific tracking functions for legal service events
export const trackLegalEvents = {
  // Document upload tracking
  documentUpload: (documentType: string, caseId: string) => {
    trackEvent('document_upload', 'legal_action', `${documentType}_case_${caseId}`);
  },

  // Case creation tracking  
  caseCreated: (caseType: string, packageType: string) => {
    trackEvent('case_created', 'legal_action', `${caseType}_${packageType}`);
  },

  // Payment tracking
  paymentInitiated: (amount: number, service: string) => {
    trackEvent('payment_initiated', 'ecommerce', service, amount);
  },

  paymentCompleted: (amount: number, service: string) => {
    trackEvent('payment_completed', 'ecommerce', service, amount);
  },

  // Analysis tracking
  analysisViewed: (caseId: string) => {
    trackEvent('analysis_viewed', 'legal_action', `case_${caseId}`);
  },

  // Document purchase tracking
  documentPurchased: (documentType: string, price: number) => {
    trackEvent('document_purchased', 'ecommerce', documentType, price);
  },

  // User engagement tracking
  loginCompleted: (userRole: string) => {
    trackEvent('login', 'user_engagement', userRole);
  },

  panelVisited: (panelType: string) => {
    trackEvent('panel_visit', 'navigation', panelType);
  },

  // Support interactions
  supportContactInitiated: (method: string) => {
    trackEvent('support_contact', 'user_engagement', method);
  },

  // Search and discovery
  searchPerformed: (query: string, resultsCount: number) => {
    trackEvent('search', 'discovery', query, resultsCount);
  },

  // Consultation booking
  consultationBooked: (consultationType: string) => {
    trackEvent('consultation_booked', 'legal_action', consultationType);
  }
};

// Track user properties for segmentation
export const setUserProperties = (properties: {
  user_role?: string;
  subscription_type?: string;
  law_firm?: string;
  user_id?: string;
}) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
    custom_map: {
      custom_parameter_1: 'user_role',
      custom_parameter_2: 'subscription_type'
    }
  });

  // Set user ID for cross-session tracking
  if (properties.user_id) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
      user_id: properties.user_id
    });
  }
};

// Enhanced ecommerce tracking for legal services
export const trackEcommerce = {
  // Track purchase of legal services
  purchase: (transactionId: string, items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
  }>, totalValue: number) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: totalValue,
      currency: 'PLN',
      items: items
    });
  },

  // Track when user adds service to cart
  addToCart: (item: {
    item_id: string;
    item_name: string;
    category: string;
    price: number;
  }) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'add_to_cart', {
      currency: 'PLN',
      value: item.price,
      items: [item]
    });
  },

  // Track when user views a service
  viewItem: (item: {
    item_id: string;
    item_name: string;
    category: string;
    price: number;
  }) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    window.gtag('event', 'view_item', {
      currency: 'PLN',
      value: item.price,
      items: [item]
    });
  }
};