import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Divider, 
  Tag, 
  Space,
  Modal,
  Table,
  Statistic,
  Alert,
  Badge,
  Spin,
  Avatar,
  Input,
  Select,
  message,
  Image
} from 'antd';
import { 
  PrinterOutlined, 
  QrcodeOutlined, 
  UserOutlined, 
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BankOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { Trash2, RefreshCw } from "lucide-react";
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import "./EmployeeIDCards.css"

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const EmployeeIDCards = () => {
  const [idCards, setIdCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [showCardBack, setShowCardBack] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [qrImageModalVisible, setQrImageModalVisible] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [refreshingSingle, setRefreshingSingle] = useState(false);
  
  const printRef = useRef();
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchIDCards();
    fetchCompanyInfo();
  }, [refreshTrigger]);

  useEffect(() => {
    let interval;
    if (printModalVisible && selectedCard) {
      interval = setInterval(() => {
        fetchSingleCard(selectedCard._id);
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [printModalVisible, selectedCard]);

  useEffect(() => {
    applyFilters();
  }, [searchText, statusFilter, roleFilter, idCards]);

  const applyFilters = () => {
    let filtered = [...idCards];

    if (searchText) {
      filtered = filtered.filter(card => 
        card.employee?.firstname?.toLowerCase().includes(searchText.toLowerCase()) ||
        card.employee?.lastname?.toLowerCase().includes(searchText.toLowerCase()) ||
        card.cardNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        card.employee?.role?.toLowerCase().includes(searchText.toLowerCase()) ||
        card.employee?.email?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(card => card.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(card => card.employee?.role === roleFilter);
    }

    setFilteredCards(filtered);
  };

  const fetchIDCards = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/id-cards/all', {
        params: {
          _t: new Date().getTime(),
          fresh: true
        }
      });
      const cards = response.data.data || response.data || [];
      
      const processedCards = cards.map(card => {
        // Removed timestamp refresh logic for photos
        const photoUrl = getImageUrl(card.photo || card.employee?.photo);
        const employeePhotoUrl = getImageUrl(card.employee?.photo);
        
        return {
          ...card,
          photo: photoUrl,
          qrCode: card.qrCode || null,
          employee: {
            ...card.employee,
            photo: employeePhotoUrl,
            phone: card.employee?.phone || 'N/A',
            email: card.employee?.email || 'N/A',
            role: card.employee?.role || 'N/A',
            employmentType: card.employee?.employmentType || 'N/A',
            firstname: card.employee?.firstname || 'Unknown',
            lastname: card.employee?.lastname || 'Employee'
          },
          _lastUpdated: new Date().toISOString()
        };
      });
      
      setIdCards(processedCards);
      setFilteredCards(processedCards);
      
      const statistics = {
        active: processedCards.filter(card => card.status === 'active').length,
        expired: processedCards.filter(card => card.status === 'expired').length,
        pending: processedCards.filter(card => card.status === 'pending').length,
        total: processedCards.length
      };
      setStats(statistics);
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const fetchSingleCard = async (cardId) => {
    try {
      const response = await axios.get(`/api/id-cards/single/${cardId}`, {
        params: { 
          _t: new Date().getTime()
        }
      });
      const card = response.data.data || response.data;
      
      if (card) {
        // Removed timestamp refresh logic for photos
        const photoUrl = getImageUrl(card.photo || card.employee?.photo);
        const employeePhotoUrl = getImageUrl(card.employee?.photo);
        
        const processedCard = {
          ...card,
          photo: photoUrl,
          qrCode: card.qrCode || null,
          employee: {
            ...card.employee,
            photo: employeePhotoUrl
          },
          _lastUpdated: new Date().toISOString()
        };
        
        if (selectedCard && selectedCard._id === cardId) {
          setSelectedCard(processedCard);
        }
        
        setIdCards(prev => prev.map(c => 
          c._id === cardId ? processedCard : c
        ));
      }
    } catch (error) {
    }
  };

  const refreshSingleCard = async () => {
    if (!selectedCard) return;
    
    try {
      setRefreshingSingle(true);
      await fetchSingleCard(selectedCard._id);
    } finally {
      setRefreshingSingle(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    
    try {
      setDeleting(true);
      const response = await axios.delete(`/api/id-cards/deleteIdCard/${cardToDelete._id}`);
      
      if (response.data.success) {
        message.success('ID card deleted successfully');
        
        setIdCards(prev => prev.filter(card => card._id !== cardToDelete._id));
        setFilteredCards(prev => prev.filter(card => card._id !== cardToDelete._id));
        
        if (stats) {
          const status = cardToDelete.status;
          const newStats = { ...stats };
          newStats.total -= 1;
          
          if (status === 'active') newStats.active -= 1;
          else if (status === 'expired') newStats.expired -= 1;
          else if (status === 'pending') newStats.pending -= 1;
          
          setStats(newStats);
        }
        
        setDeleteModalVisible(false);
        setCardToDelete(null);
        
        if (selectedCard && selectedCard._id === cardToDelete._id) {
          setPrintModalVisible(false);
          setSelectedCard(null);
        }
      } else {
        message.error(response.data.message || 'Failed to delete ID card');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error deleting ID card');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (card) => {
    setCardToDelete(card);
    setDeleteModalVisible(true);
  };

  const showQRImage = (card) => {
    if (card?.qrCode) {
      setQrImageUrl(card.qrCode);
      setQrImageModalVisible(true);
    } else {
      message.warning('QR code not found for this card');
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      setOrgLoading(true);
      
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/org/org', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: { _t: new Date().getTime() }
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
      
      if (orgsArray.length > 0) {
        const org = orgsArray[0];
        
        let logoUrl = null;
        // Removed timestamp refresh logic for company logo
        if (org.logo) {
          if (typeof org.logo === 'string') {
            logoUrl = org.logo.startsWith('/uploads/') 
              ? org.logo
              : org.logo;
          } else if (typeof org.logo === 'object' && org.logo.url) {
            logoUrl = org.logo.url.startsWith('/uploads/')
              ? org.logo.url
              : org.logo.url;
          }
        }
        
        let address = '';
        if (org.address) {
          const parts = [];
          if (org.address.street) parts.push(org.address.street);
          if (org.address.city) parts.push(org.address.city);
          if (org.address.state) parts.push(org.address.state);
          if (org.address.country) parts.push(org.address.country);
          address = parts.join(', ');
        }
        
        setCompanyInfo({
          name: org.name || '',
          logo: logoUrl,
          industry: org.industry || '',
          email: org.email || '',
          phone: org.phone || '',
          address: address,
          website: org.website || '',
          status: org.status || 'active'
        });
      } else {
        setCompanyInfo(null);
      }
      
      setOrgLoading(false);
    } catch (error) {
      setCompanyInfo(null);
      setOrgLoading(false);
    }
  };

  const getImageUrl = (photoPath) => {
    if (!photoPath) return null;

    if (typeof photoPath === 'string' && (photoPath.startsWith('http://') || photoPath.startsWith('https://'))) {
      return photoPath;
    }

    if (typeof photoPath === 'string' && photoPath.startsWith('/uploads')) {
      return `${photoPath}`;
    }

    if (typeof photoPath === 'string' && photoPath.startsWith('uploads')) {
      return `/${photoPath}`;
    }

    if (typeof photoPath === 'object' && photoPath.url) {
      return getImageUrl(photoPath.url);
    }

    if (typeof photoPath === 'object' && photoPath.path) {
      return getImageUrl(photoPath.path);
    }

    if (typeof photoPath === 'string') {
      return `/uploads/${photoPath}`;
    }

    return null;
  };
  
  const handleReactToPrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Employee_ID_Card_${selectedCard?.cardNumber || 'Print'}`,
    removeAfterPrint: true,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
    onPrintError: () => {
      setIsPrinting(false);
    }
  });

  const columns = [
    {
      title: 'Card Number',
      dataIndex: 'cardNumber',
      key: 'cardNumber',
      render: (text) => <Text strong>{text}</Text>,
      width: 120,
    },
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
      render: (employee, record) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.photo || employee?.photo}
            icon={<UserOutlined />}
          />
          <span>{employee?.firstname} {employee?.lastname}</span>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'employee',
      key: 'role',
      render: (employee) => employee?.role || 'N/A',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;
        
        switch (status) {
          case 'active':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'expired':
            color = 'error';
            icon = <CloseCircleOutlined />;
            break;
          case 'pending':
            color = 'warning';
            icon = <ClockCircleOutlined />;
            break;
          default:
            color = 'default';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<IdcardOutlined />}
            onClick={() => handleViewCard(record)}
          >
            View Card
          </Button>
        
          <Button
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => handleViewQR(record)}
          >
            QR Code
          </Button>
          
          <Button
            size="small"
            danger
            icon={<Trash2 />}
            onClick={() => confirmDelete(record)}
            title="Delete ID card"
          />
        </Space>
      ),
    },
  ];

  const handleViewCard = (card) => {
    setSelectedCard(card);
    setShowCardBack(false);
    setPrintModalVisible(true);
  };

  const handleViewQR = (card) => {
    setSelectedCard(card);
    setQrModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'expired': return 'red';
      case 'pending': return 'orange';
      default: return 'blue';
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card size="small">
      <Statistic
        title={title}
        value={value}
        prefix={icon}
        styles={{
          content: { color }
        }}
      />
    </Card>
  );

  const SimpleQRCode = ({ card, size = 80 }) => {
    const qrCodeFromDB = card?.qrCode;
    
    if (!qrCodeFromDB) {
      return (
        <div style={{
          width: size,
          height: size,
          backgroundColor: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
        }}>
          <Text type="secondary" style={{ fontSize: '10px' }}>
            No QR
          </Text>
        </div>
      );
    }
    
    return (
      <div style={{
        width: size,
        height: size,
        backgroundColor: '#ffffff',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px',
      }}>
        <img 
          src={qrCodeFromDB} 
          alt="QR Code" 
          style={{ 
            width: '100%', 
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </div>
    );
  };

  // Get employee photo URL - REMOVED TIMESTAMP REFRESH LOGIC
  const getEmployeePhoto = (card) => {
    const photoUrl = card?.photo || card?.employee?.photo;
    
    // Return the URL without timestamp cache busting
    if (photoUrl) {
      return getImageUrl(photoUrl);
    }
    
    // Fallback without cache busting
    const firstName = card?.employee?.firstname || '';
    const lastName = card?.employee?.lastname || '';
    return `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=1890ff&color=fff&size=100`;
  };

  // Get company logo URL - REMOVED TIMESTAMP REFRESH LOGIC
  const getCompanyLogo = (company) => {
    if (!company) {
      return `https://ui-avatars.com/api/?name=Company&background=1890ff&color=fff&size=64`;
    }
    
    if (company?.logo) {
      const logoUrl = getImageUrl(company.logo);
      if (logoUrl) {
        return logoUrl;
      }
    }
    
    return `https://ui-avatars.com/api/?name=${company?.name || 'Company'}&background=1890ff&color=fff&size=64`;
  };

  const IDCardFront = ({ card, company }) => {
    const employeePhoto = getEmployeePhoto(card);
    const companyLogo = getCompanyLogo(company);
    
    return (
      <div style={styles.cardFront}>
        <div style={styles.cardHeader}>
          <div style={styles.companyLogoSection}>
            {companyLogo && (
              <img
                src={companyLogo}
                alt="Company Logo"
                style={styles.companyLogo}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${company?.name || 'Company'}&background=1890ff&color=fff&size=48`;
                }}
              />
            )}
            <div style={styles.companyNameSection}>
              <Text strong style={styles.companyName}>
                {company?.name || 'EMPLOYEE ID CARD'}
              </Text>
              <Text type="secondary" style={styles.cardType}>
                EMPLOYEE ID CARD
              </Text>
            </div>
          </div>
          
          <div>
            <Badge 
              status="processing" 
              text={card?.status?.toUpperCase() || 'ACTIVE'}
              color={getStatusColor(card?.status)}
              style={{ fontSize: '10px' }}
            />
          </div>
        </div>

        <Divider style={styles.cardDivider} />

        <div style={styles.cardContent}>
          <div style={styles.photoSection}>
            <div style={styles.photoContainer}>
              <img
                src={employeePhoto}
                alt="Employee Photo"
                style={styles.photo}
                onError={(e) => {
                  e.target.onerror = null;
                  const firstName = card?.employee?.firstname || '';
                  const lastName = card?.employee?.lastname || '';
                  e.target.src = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=1890ff&color=fff&size=100`;
                }}
              />
            </div>
            <div style={styles.cardNumberSection}>
              <Tag color="blue" style={styles.cardNumberTag}>
                ID: {card?.cardNumber}
              </Tag>
            </div>
          </div>

          <div style={styles.detailsSection}>
            <div style={styles.employeeName}>
              <Text strong style={{ fontSize: '16px' }}>
                {card?.employee?.firstname} {card?.employee?.lastname}
              </Text>
            </div>
            
            <div style={styles.detailRow}>
              <TeamOutlined style={styles.icon} />
              <Text style={styles.label}>Role:</Text>
              <Text style={{ fontSize: '11px' }}>{card?.employee?.role || 'N/A'}</Text>
            </div>
            
            <div style={styles.detailRow}>
              <MailOutlined style={styles.icon} />
              <Text style={styles.label}>Email:</Text>
              <Text style={{ fontSize: '10px' }}>{card?.employee?.email || 'N/A'}</Text>
            </div>
            
            <div style={styles.detailRow}>
              <PhoneOutlined style={styles.icon} />
              <Text style={styles.label}>Phone:</Text>
              <Text style={{ fontSize: '11px' }}>{card?.employee?.phone || 'N/A'}</Text>
            </div>
            
            <div style={styles.qrCodeSection}>
              <SimpleQRCode card={card} size={70} />
              <div style={styles.qrLabel}>
                <Text type="secondary" style={{ fontSize: '9px' }}>
                  {card?.qrCode ? '' : 'No QR'}
                </Text>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.signatureLine}></div>
          <Text type="secondary" style={{ fontSize: '9px' }}>Authorized Signature</Text>
        </div>
      </div>
    );
  };

  const IDCardBack = ({ card, company }) => {
    const companyLogo = getCompanyLogo(company);
    
    return (
      <div style={styles.cardBack}>
        <div style={styles.magneticStrip}></div>
        
        <div style={styles.backCompanyInfo}>
          {companyLogo && (
            <img
              src={companyLogo}
              alt="Company Logo"
              style={styles.backLogo}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${company?.name || 'Company'}&background=1890ff&color=fff&size=64`;
              }}
            />
          )}
          <Text strong style={styles.backCompanyName}>
            {company?.name || 'EMPLOYEE ID CARD'}
          </Text>
          {company?.industry && (
            <Text style={styles.backCompanyDetail}>
              <TeamOutlined /> {company.industry}
            </Text>
          )}
          {company?.phone && (
            <Text style={styles.backCompanyDetail}>
              <PhoneOutlined /> {company.phone}
            </Text>
          )}
          {company?.email && (
            <Text style={styles.backCompanyDetail}>
              <MailOutlined /> {company.email}
            </Text>
          )}
        </div>

        <div style={styles.termsContainer}>
          <Title level={5} style={styles.termsTitle}>TERMS & CONDITIONS</Title>
          <ul style={styles.termsList}>
            <li style={styles.termItem}>
              <Text style={styles.termText}>
                This card is property of {company?.name || 'the organization'}
              </Text>
            </li>
            <li style={styles.termItem}>
              <Text style={styles.termText}>
                Must be worn visibly at all times on premises
              </Text>
            </li>
            <li style={styles.termItem}>
              <Text style={styles.termText}>
                Report lost cards immediately to HR
              </Text>
            </li>
            <li style={styles.termItem}>
              <Text style={styles.termText}>
                Return upon termination of employment
              </Text>
            </li>
            <li style={styles.termItem}>
              <Text style={styles.termText}>
                Valid from {card?.issueDate ? new Date(card.issueDate).toLocaleDateString() : 'N/A'}
              </Text>
            </li>
            <li style={styles.termItem}>
              <Text style={styles.termText}>
                Expires {card?.expiryDate ? new Date(card.expiryDate).toLocaleDateString() : 'N/A'}
              </Text>
            </li>
          </ul>
        </div>

        <div style={styles.emergencyContact}>
          <Text strong style={{ fontSize: '10px' }}>EMERGENCY CONTACT</Text>
          <Text style={{ fontSize: '10px' }}>HR Department: {company?.phone || 'Contact HR'}</Text>
        </div>

        <div style={styles.backCardNumber}>
          <Text type="secondary" style={{ fontSize: '10px' }}>
            #{card?.cardNumber} • {card?.employee?.firstname?.charAt(0)}{card?.employee?.lastname?.charAt(0)}
          </Text>
        </div>
      </div>
    );
  };

  const getUniqueRoles = () => {
    const roles = new Set();
    idCards.forEach(card => {
      if (card.employee?.role) {
        roles.add(card.employee.role);
      }
    });
    return Array.from(roles);
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setRoleFilter('all');
  };

  const PrintComponent = () => {
    if (!selectedCard) return null;
    
    return (
      <div className="print-content" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ 
          ...styles.cardContainer,
          transform: 'scale(1.2)',
          margin: '40px auto'
        }}>
          {showCardBack ? (
            <IDCardBack card={selectedCard} company={companyInfo} />
          ) : (
            <IDCardFront card={selectedCard} company={companyInfo} />
          )}
        </div>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          Printed on: {new Date().toLocaleDateString()} | Employee ID: {selectedCard.cardNumber}
        </div>
      </div>
    );
  };

  return (
    <div className="employee-id-cards-container">
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <PrintComponent />
        </div>
      </div>

      <Card className="no-print" style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={24}>
            <Space>
              <IdcardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>Employee ID Cards Management</Title>
            </Space>
            <Text type="secondary" style={{ marginLeft: 20 }}>
              Issue, manage, and print employee identification cards
            </Text>
          </Col>
          
          {stats && (
            <Col span={24}>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={12} md={8}>
                  <StatCard
                    title="Active Cards"
                    value={stats.active || 0}
                    icon={<CheckCircleOutlined />}
                    color="#52c41a"
                  />
                </Col>
                
                <Col xs={12} sm={12} md={8}>
                  <StatCard
                    title="Expired Cards"
                    value={stats.expired || 0}
                    icon={<CloseCircleOutlined />}
                    color="#f5222d"
                  />
                </Col>
                
                <Col xs={24} sm={24} md={8}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                      <StatCard
                        title="Total Issued"
                        value={stats.total || 0}
                        icon={<TeamOutlined />}
                        color="#1890ff"
                      />
                    </div>
                  </div>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </Card>

      {companyInfo && !orgLoading ? (
        <Alert
          className="no-print"
          type="info"
          showIcon
          icon={<BankOutlined />}
          title={
            <Space>
              <span>Company: {companyInfo.name}</span>
              {companyInfo.industry && (
                <Tag color="blue">{companyInfo.industry}</Tag>
              )}
            </Space>
          }
          description={`Email: ${companyInfo.email || 'N/A'} | Status: ${companyInfo.status}`}
          style={{ marginBottom: 20 }}
        />
      ) : !orgLoading && (
        <Alert
          className="no-print"
          type="warning"
          showIcon
          icon={<BankOutlined />}
          title="No Organisation Found"
          description="Please create an organisation first to generate ID cards with company information."
          style={{ marginBottom: 20 }}
        />
      )}

      <Card 
        className="no-print" 
        title={
          <Space>
            <FilterOutlined />
            <span>Search & Filter ID Cards</span>
          </Space>
        }
        style={{ marginBottom: 20 }}
        size="small"
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="Search by name, card number, role, or email..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={applyFilters}
            />
          </Col>
          
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              size="middle"
            >
              <Option value="all">All Statuses</Option>
              <Option value="active">Active</Option>
              <Option value="pending">Pending</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Role"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              size="middle"
            >
              <Option value="all">All Roles</Option>
              {getUniqueRoles().map(role => (
                <Option key={role} value={role}>{role}</Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Button
                onClick={resetFilters}
                size="middle"
              >
                Reset Filters
              </Button>
              <Tag color="blue" style={{ margin: 0 }}>
                {filteredCards.length}/{idCards.length} cards
              </Tag>
            </Space>
          </Col>
        </Row>
        
        {(searchText || statusFilter !== 'all' || roleFilter !== 'all') && (
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Space wrap>
                <Text type="secondary">Active Filters:</Text>
                {searchText && (
                  <Tag 
                    closable 
                    onClose={() => setSearchText('')}
                    color="processing"
                  >
                    Search: {searchText}
                  </Tag>
                )}
                {statusFilter !== 'all' && (
                  <Tag 
                    closable 
                    onClose={() => setStatusFilter('all')}
                    color={getStatusColor(statusFilter)}
                  >
                    Status: {statusFilter}
                  </Tag>
                )}
                {roleFilter !== 'all' && (
                  <Tag 
                    closable 
                    onClose={() => setRoleFilter('all')}
                    color="purple"
                  >
                    Role: {roleFilter}
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        )}
      </Card>

      <Card 
        className="no-print"
        title={
          <Space>
            <IdcardOutlined />
            <span>Employee ID Cards List</span>
            <Badge 
              count={filteredCards.length} 
              style={{ backgroundColor: '#1890ff' }}
              showZero 
            />
            {filteredCards.length !== idCards.length && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                (Filtered from {idCards.length} total)
              </Text>
            )}
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>
              <Text type="secondary">Loading ID cards...</Text>
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            title="No ID Cards Found"
            description={
              idCards.length === 0 
                ? "No employee ID cards have been issued yet. Create ID cards for employees."
                : "No ID cards match your search criteria. Try different filters or search terms."
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCards}
            loading={loading}
            rowKey="_id"
            pagination={false}
            size="middle"
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
            <IdcardOutlined />
            <span>Employee ID Card Preview</span>
            {selectedCard && (
              <>
                <Tag color="blue">{selectedCard.cardNumber}</Tag>
                <Badge 
                  dot 
                  color="#52c41a" 
                  text="Live Data"
                  style={{ fontSize: '10px' }}
                />
              </>
            )}
          </Space>
        }
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button 
            key="refresh"
            icon={<RefreshCw />}
            onClick={refreshSingleCard}
            loading={refreshingSingle}
            disabled={!selectedCard}
          >
          
          </Button>,
          <Button 
            key="flip" 
            icon={showCardBack ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
            onClick={() => setShowCardBack(!showCardBack)}
          >
            {showCardBack ? 'Show Front' : 'Show Back'}
          </Button>,
          <Button key="close" onClick={() => setPrintModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handleReactToPrint}
            loading={isPrinting}
          >
            {isPrinting ? 'Printing...' : 'Print Card'}
          </Button>,
        ]}
        width={600}
        centered
      >
        {selectedCard && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '20px'
          }}>
            <div className="card-container" style={styles.cardContainer}>
              {showCardBack ? (
                <IDCardBack card={selectedCard} company={companyInfo} />
              ) : (
                <IDCardFront card={selectedCard} company={companyInfo} />
              )}
            </div>
            
            <Divider />
            <Alert
              type="info"
              showIcon
              title="Card Information"
              description={
                <Row gutter={[16, 8]}>
                  <Col span={8}>
                    <Text strong>Employee:</Text>
                    <br />
                    <Text>{selectedCard.employee?.firstname} {selectedCard.employee?.lastname}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Issue Date:</Text>
                    <br />
                    <Text>{selectedCard.issueDate ? new Date(selectedCard.issueDate).toLocaleDateString() : 'N/A'}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>Expiry Date:</Text>
                    <br />
                    <Text>{selectedCard.expiryDate ? new Date(selectedCard.expiryDate).toLocaleDateString() : 'N/A'}</Text>
                  </Col>
                  <Col span={24} style={{ marginTop: '10px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Last updated: {selectedCard._lastUpdated ? new Date(selectedCard._lastUpdated).toLocaleTimeString() : 'Just now'}
                    </Text>
                  </Col>
                </Row>
              }
            />
          </div>
        )}
      </Modal>

      <Modal
        title="QR Code Validation"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Close
          </Button>,
        ]}
        centered
      >
        {selectedCard && (
          <div style={styles.qrModalContent}>
            <div style={styles.qrDisplay}>
              <SimpleQRCode card={selectedCard} size={200} />
            </div>
            
            <Divider />
            
            <Alert
              type="info"
              showIcon
              title="QR Code Information"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={styles.qrInfoRow}>
                    <Text strong>Card Number:</Text>
                    <Text>{selectedCard.cardNumber}</Text>
                  </div>
                  <div style={styles.qrInfoRow}>
                    <Text strong>Employee:</Text>
                    <Text>{selectedCard.employee?.firstname} {selectedCard.employee?.lastname}</Text>
                  </div>
                  <div style={styles.qrInfoRow}>
                    <Text strong>Role:</Text>
                    <Text>{selectedCard.employee?.role}</Text>
                  </div>
                  <div style={styles.qrInfoRow}>
                    <Text strong>Status:</Text>
                    <Tag color={getStatusColor(selectedCard.status)}>
                      {selectedCard.status.toUpperCase()}
                    </Tag>
                  </div>
                  <div style={styles.qrInfoRow}>
                    <Text strong>Expires:</Text>
                    <Text>{selectedCard.expiryDate ? new Date(selectedCard.expiryDate).toLocaleDateString() : 'N/A'}</Text>
                  </div>
                  <div style={styles.qrInfoRow}>
                    <Text strong>QR Source:</Text>
                    <Text>{selectedCard.qrCode ? 'From Database' : 'No QR Code'}</Text>
                  </div>
                </Space>
              }
            />
            
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Text type="secondary">
                <small>
                  {selectedCard.qrCode 
                    ? ''
                    : 'No QR code found for this card.'}
                </small>
              </Text>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <QrcodeOutlined />
            <span>QR Code Image from Database</span>
            {selectedCard && (
              <Tag color="blue">{selectedCard.cardNumber}</Tag>
            )}
          </Space>
        }
        open={qrImageModalVisible}
        onCancel={() => {
          setQrImageModalVisible(false);
          setQrImageUrl(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setQrImageModalVisible(false);
            setQrImageUrl(null);
          }}>
            Close
          </Button>,
        ]}
        centered
        width={400}
      >
        {qrImageUrl ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Image
              src={qrImageUrl}
              alt="QR Code from Database"
              style={{
                maxWidth: '300px',
                maxHeight: '300px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                padding: '10px',
                backgroundColor: '#fff'
              }}
              preview={false}
            />
            <div style={{ marginTop: '20px' }}>
              <Text type="secondary">
                This QR code image is stored directly in MongoDB as Base64
              </Text>
            </div>
            {selectedCard && (
              <div style={{ marginTop: '10px' }}>
                <Tag color="green">Card: {selectedCard.cardNumber}</Tag>
                <Tag color="blue">Employee: {selectedCard.employee?.firstname} {selectedCard.employee?.lastname}</Tag>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px' }}>
              <Text>Loading QR code...</Text>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setCardToDelete(null);
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setDeleteModalVisible(false);
              setCardToDelete(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleting}
            onClick={handleDeleteCard}
            icon={<DeleteOutlined />}
          >
            Delete ID Card
          </Button>,
        ]}
        centered
      >
        {cardToDelete && (
          <div>
            <Alert
              type="error"
              showIcon
              message="Warning: This action cannot be undone!"
              description="Deleting this ID card will permanently remove it from the system."
              style={{ marginBottom: '20px' }}
            />
            
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar 
                    size="small" 
                    src={cardToDelete.photo || cardToDelete.employee?.photo}
                    icon={<UserOutlined />}
                  />
                  <Text strong>
                    {cardToDelete.employee?.firstname} {cardToDelete.employee?.lastname}
                  </Text>
                </div>
                
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text type="secondary">Card Number:</Text>
                    <br />
                    <Text strong>{cardToDelete.cardNumber}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Status:</Text>
                    <br />
                    <Tag color={getStatusColor(cardToDelete.status)}>
                      {cardToDelete.status?.toUpperCase()}
                    </Tag>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Employee Role:</Text>
                    <br />
                    <Text>{cardToDelete.employee?.role || 'N/A'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Expiry Date:</Text>
                    <br />
                    <Text>
                      {cardToDelete.expiryDate ? 
                        new Date(cardToDelete.expiryDate).toLocaleDateString() : 
                        'N/A'
                      }
                    </Text>
                  </Col>
                </Row>
              </Space>
            </Card>
            
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff2f0', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Note: This will only delete the ID card record. The employee record will remain unaffected.
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const styles = {
  cardContainer: {
    width: '85.6mm', 
    height: '54mm',  
    perspective: '1000px',
    margin: '0 auto',
  },
  
  cardFront: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '8px',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
  },
  
  cardBack: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f2f5',
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '8px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  
  companyLogoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  
  companyLogo: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
    borderRadius: '4px',
  },
  
  companyNameSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  
  companyName: {
    fontSize: '10px',
    lineHeight: '1.2',
    color: '#1890ff',
  },
  
  cardType: {
    fontSize: '8px',
    color: '#666',
  },
  
  cardDivider: {
    margin: '4px 0',
    borderColor: '#1890ff',
    opacity: 0.5,
  },
  
  cardContent: {
    display: 'flex',
    gap: '3px',
    height: 'calc(100% - 60px)',
  },
  
  photoSection: {
    width: '35%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  
  photoContainer: {
    width: '100%',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  photo: {
    width: '70px',
    height: '60px',
    objectFit: 'cover',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
  },
  
  cardNumberSection: {
    width: '100%',
    textAlign: 'center',
  },
  
  cardNumberTag: {
    fontSize: '8px',
    padding: '2px 6px',
    margin: 0,
    borderRadius: '3px',
  },
  
  detailsSection: {
    width: '65%',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  
  employeeName: {
    fontSize: '12px',
    marginBottom: '2px',
    color: '#262626',
    fontWeight: '600',
  },
  
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
  },
  
  icon: {
    fontSize: '10px',
    color: '#1890ff',
    minWidth: '12px',
  },
  
  label: {
    color: '#666',
    minWidth: '35px',
    fontSize: '9px',
  },
  
  qrCodeSection: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  
  qrLabel: {
    fontSize: '7px',
    textAlign: 'center',
  },
  
  cardFooter: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 'calc(100% - 90px)',
  },
  
  signatureLine: {
    width: '100%',
    height: '1px',
    backgroundColor: '#000',
    marginBottom: '1px',
  },
  
  magneticStrip: {
    width: '100%',
    height: '12px',
    backgroundColor: '#000',
    borderRadius: '2px',
    marginBottom: '8px',
  },
  
  backCompanyInfo: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  
  backLogo: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
    marginBottom: '4px',
    borderRadius: '4px',
  },
  
  backCompanyName: {
    fontSize: '11px',
    color: '#1890ff',
    display: 'block',
    marginBottom: '2px',
  },
  
  backCompanyDetail: {
    fontSize: '8px',
    color: '#666',
    display: 'block',
    lineHeight: '1.3',
    marginBottom: '1px',
  },
  
  termsContainer: {
    flex: 1,
    marginBottom: '8px',
  },
  
  termsTitle: {
    fontSize: '9px',
    margin: '0 0 4px 0',
    color: '#1890ff',
    textAlign: 'center',
  },
  
  termsList: {
    margin: 0,
    paddingLeft: '12px',
  },
  
  termItem: {
    marginBottom: '2px',
  },
  
  termText: {
    fontSize: '7px',
    lineHeight: '1.2',
    color: '#666',
  },
  
  emergencyContact: {
    textAlign: 'center',
    padding: '4px',
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
    borderRadius: '4px',
    marginBottom: '4px',
    border: '1px solid rgba(255, 0, 0, 0.1)',
  },
  
  backCardNumber: {
    textAlign: 'center',
    paddingTop: '2px',
    borderTop: '1px dashed #d9d9d9',
  },
  
  qrModalContent: {
    textAlign: 'center',
  },
  
  qrDisplay: {
    padding: '20px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  qrInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
};

export default EmployeeIDCards;



