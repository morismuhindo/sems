import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building2, Calendar, CheckCircle, AlertCircle,
  Mail, Phone, MapPin, Briefcase, Hash, Globe,
  Map, Home, Navigation, Printer,
  RefreshCw, Terminal, List
} from 'lucide-react';
import './organisation.css';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      className: 'status-badge-activeORPF',
      icon: <CheckCircle size={16} />,
      label: 'Active'
    },
    inactive: {
      className: 'status-badge-inactiveORPF',
      icon: <AlertCircle size={16} />,
      label: 'Inactive'
    },
    pending: {
      className: 'status-badge-pendingORPF',
      icon: <AlertCircle size={16} />,
      label: 'Pending'
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span className={`status-badgeORPF ${config.className}`}>
      {config.icon}
      <span className="ml-1ORPF">{config.label}</span>
    </span>
  );
};

const IndustryBadge = ({ industry }) => {
  const industryColors = {
    'Technology': 'industry-techORPF',
    'Healthcare': 'industry-healthORPF',
    'Finance': 'industry-financeORPF',
    'Education': 'industry-educationORPF',
    'Manufacturing': 'industry-manufacturingORPF',
    'Retail': 'industry-retailORPF',
    'Construction': 'industry-constructionORPF',
    'Hospitality': 'industry-hospitalityORPF',
    'Transportation': 'industry-transportationORPF',
    'Other': 'industry-otherORPF'
  };

  return (
    <span className={`industry-badgeORPF ${industryColors[industry] || 'industry-otherORPF'}`}>
      {industry || 'Not specified'}
    </span>
  );
};

const StatCard = ({ icon, label, value, children }) => (
  <div className="stat-cardORPF">
    <div className="stat-iconORPF">
      {icon}
    </div>
    <div className="stat-contentORPF">
      <div className="stat-labelORPF">{label}</div>
      <div className="stat-valueORPF">
        {children || value}
      </div>
    </div>
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="info-itemORPF">
    <div className="info-labelORPF">
      {icon}
      {label}
    </div>
    <div className="info-valueORPF">
      {value || 'Not specified'}
    </div>
  </div>
);

const AddressLine = ({ icon, text, label, prefix = '' }) => (
  <div className="address-lineORPF">
    {icon}
    <span className="address-labelORPF">{label}:</span>
    <span className="address-textORPF">{prefix}{text}</span>
  </div>
);

const LoadingState = () => (
  <div className="organisation-containerORPF">
    <div className="loading-containerORPF">
      <div className="loading-spinnerORPF"></div>
      <p>Loading organisation details...</p>
    </div>
  </div>
);

const ErrorState = ({ error, allOrganisations, onRetry }) => (
  <div className="organisation-containerORPF">
    <div className="error-containerORPF">
      <AlertCircle className="error-iconORPF" size={48} />
      <h3 className="error-titleORPF">Unable to Load Organisation</h3>
      <p className="error-messageORPF">{error}</p>
      
      <div className="debug-info-boxORPF">
        <h4><Terminal size={16} /> Debug Information</h4>
        <div className="debug-detailsORPF">
          <p><strong>Token exists:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
          <p><strong>Organisations in array:</strong> {allOrganisations.length}</p>
        </div>
      </div>
      
      <div className="error-actionsORPF">
        <button 
          onClick={onRetry} 
          className="action-buttonORPF secondary-buttonORPF"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="organisation-containerORPF">
    <div className="not-found-containerORPF">
      <Building2 className="not-found-iconORPF" size={64} />
      <h3 className="not-found-titleORPF">No Organisations Found</h3>
      <p className="not-found-messageORPF">
        No organisations are available. Please create an organisation first.
      </p>
    </div>
  </div>
);

const OrganisationSelector = ({ organisations, selectedOrg, onSelect }) => {
  if (organisations.length <= 1) return null;

  return (
    <div className="organisation-selectorORPF">
      <div className="selector-headerORPF">
        <List size={20} />
        <h3>Select Organisation</h3>
      </div>
      <div className="selector-optionsORPF">
        {organisations.map((org) => (
          <button
            key={org.id || org._id}
            className={`org-optionORPF ${selectedOrg && (selectedOrg.id === org.id || selectedOrg._id === org._id) ? 'activeORPF' : ''}`}
            onClick={() => onSelect(org)}
          >
            <div className="org-option-iconORPF">
              <Building2 size={16} />
            </div>
            <div className="org-option-infoORPF">
              <span className="org-option-nameORPF">{org.name}</span>
              <span className="org-option-industryORPF">{org.industry}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const OrganisationBanner = ({ organisation }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="organisation-bannerORPF">
      <div className="banner-contentORPF">
        <div className="organisation-logo-sectionORPF">
          <div className="logo-containerORPF">
            {organisation.logo ? (
              <img 
                src={organisation.logo} 
                alt={organisation.name} 
                className="organisation-logoORPF"
              />
            ) : (
              <div className="logo-placeholderORPF">
                <Building2 size={48} />
              </div>
            )}
          </div>
          <div className="organisation-basic-infoORPF">
            <h2 className="organisation-nameORPF">{organisation.name}</h2>
            <div className="organisation-metaORPF">
              <div className="organisation-statusORPF">
                <StatusBadge status={organisation.status || 'active'} />
              </div>
            </div>
          </div>
        </div>

        <div className="quick-statsORPF">
          <StatCard 
            icon={<Briefcase size={24} />} 
            label="Industry"
          >
            <IndustryBadge industry={organisation.industry} />
          </StatCard>
          
          <StatCard 
            icon={<Calendar size={24} />} 
            label="Created"
            value={formatDate(organisation.createdAt)}
          />
          
          <StatCard 
            icon={<Hash size={24} />} 
            label="Registration"
            value={organisation.registrationNumber}
          />
        </div>
      </div>
    </div>
  );
};

const ContentSection = ({ icon, title, children }) => (
  <section className="content-sectionORPF">
    <div className="section-headerORPF">
      <div className="section-iconORPF">
        {icon}
      </div>
      <h3 className="section-titleORPF">{title}</h3>
    </div>
    <div className="section-contentORPF">
      {children}
    </div>
  </section>
);

const AddressSection = ({ address }) => (
  <div className="address-cardORPF">
    <div className="address-headerORPF">
      <MapPin size={20} />
      <span>Full Address</span>
    </div>
    <div className="address-detailsORPF">
      {address?.street && (
        <AddressLine 
          icon={<Home size={16} />} 
          label="Street" 
          text={address.street} 
        />
      )}
      {address?.city && (
        <AddressLine 
          icon={<Navigation size={16} />} 
          label="City" 
          text={address.city} 
        />
      )}
      {address?.state && (
        <AddressLine 
          icon={<Map size={16} />} 
          label="State/Province" 
          text={address.state} 
        />
      )}
      {address?.country && (
        <AddressLine 
          icon={<Globe size={16} />} 
          label="Country" 
          text={address.country} 
        />
      )}
      {address?.zipCode && (
        <AddressLine 
          icon={<Hash size={16} />} 
          label="Postal/ZIP Code" 
          text={address.zipCode} 
        />
      )}
      {!address && (
        <div className="no-addressORPF">
          Address information not available
        </div>
      )}
    </div>
  </div>
);

const Organisation = () => {
  const [organisation, setOrganisation] = useState(null);
  const [allOrganisations, setAllOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorORPF, setErrorORPF] = useState('');

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      setLoading(true);
      setErrorORPF('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setErrorORPF('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/org/org', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let orgsArray = [];
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          orgsArray = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          orgsArray = Object.values(response.data.data);
        }
      } else if (Array.isArray(response.data)) {
        orgsArray = response.data;
      }
      
      setAllOrganisations(orgsArray);
      
      if (orgsArray.length > 0) {
        setOrganisation(orgsArray[0]);
      } else {
        setErrorORPF('No organisations found. Please create an organisation first.');
      }
      
    } catch (err) {
      setErrorORPF('Failed to load organisation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganisation = (org) => {
    setOrganisation(org);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (errorORPF) {
    return (
      <ErrorState 
        error={errorORPF}
        allOrganisations={allOrganisations}
        onRetry={fetchOrganisations}
      />
    );
  }

  if (!organisation && allOrganisations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="organisation-containerORPF">
      <div className="organisation-headerORPF">
        <div className="header-contentORPF">
          <div className="header-titleORPF">
            <Building2 className="header-iconORPF" size={32} />
            <h1>Organisation Details</h1>
          </div>
        </div>
      </div>

      <OrganisationSelector
        organisations={allOrganisations}
        selectedOrg={organisation}
        onSelect={handleSelectOrganisation}
      />

      <div className="organisation-cardORPF">
        <OrganisationBanner organisation={organisation} />

        <div className="organisation-contentORPF">
          <ContentSection icon={<Mail size={24} />} title="Contact Information">
            <div className="info-gridORPF">
              <InfoItem 
                icon={<Mail size={16} />}
                label="Email Address"
                value={organisation.email}
              />
              <InfoItem 
                icon={<Phone size={16} />}
                label="Phone Number"
                value={organisation.phone}
              />
            </div>
          </ContentSection>

          <ContentSection icon={<MapPin size={24} />} title="Address Details">
            <AddressSection address={organisation.address} />
          </ContentSection>

          <ContentSection icon={<Building2 size={24} />} title="Additional Information">
            <div className="info-gridORPF">
              <InfoItem 
                icon={<Calendar size={16} />}
                label="Created On"
                value={formatDate(organisation.createdAt)}
              />
              {organisation.updatedAt && (
                <InfoItem 
                  icon={<Calendar size={16} />}
                  label="Last Updated"
                  value={formatDate(organisation.updatedAt)}
                />
              )}
            </div>
          </ContentSection>
        </div>
      </div>

      
    </div>
  );
};

export default Organisation;