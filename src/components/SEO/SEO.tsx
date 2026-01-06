import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'business.business';
  schema?: Record<string, any>;
  noindex?: boolean;
}

const SITE_NAME = 'Frizerski Saloni BiH';
const DEFAULT_DESCRIPTION = 'Pronađite najboljeg frizera u vašem gradu. Pretražite frizerske salone, pogledajte cijene i zakažite termin online.';
const DEFAULT_IMAGE = '/og-image.jpg';
const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://frizerski-saloni.ba';

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  canonical,
  image,
  type = 'website',
  schema,
  noindex = false
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullCanonical = canonical ? `${BASE_URL}${canonical}` : undefined;
  const fullImage = image ? (image.startsWith('http') ? image : `${BASE_URL}${image}`) : `${BASE_URL}${DEFAULT_IMAGE}`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="bs_BA" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Additional SEO */}
      <meta name="author" content={SITE_NAME} />
      <meta name="geo.region" content="BA" />
      <meta name="geo.placename" content="Bosna i Hercegovina" />
      
      {/* JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

// Pre-built schemas for common pages
export const createOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: [
    'https://facebook.com/frizerski-saloni-bih',
    'https://instagram.com/frizerski_saloni_bih'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Bosnian', 'Croatian', 'Serbian']
  }
});

export const createWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/pretraga?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
});

export const createBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.url}`
  }))
});

export const createLocalBusinessSchema = (salon: {
  name: string;
  description?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  slug?: string;
  workingHours?: any;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'HairSalon',
  name: salon.name,
  description: salon.description,
  image: salon.image,
  address: {
    '@type': 'PostalAddress',
    streetAddress: salon.address,
    addressLocality: salon.city,
    addressCountry: 'BA'
  },
  telephone: salon.phone,
  email: salon.email,
  url: salon.slug ? `${BASE_URL}/salon/${salon.slug}` : undefined,
  aggregateRating: salon.rating && salon.reviewCount ? {
    '@type': 'AggregateRating',
    ratingValue: salon.rating,
    reviewCount: salon.reviewCount,
    bestRating: 5,
    worstRating: 1
  } : undefined
});

export default SEO;
