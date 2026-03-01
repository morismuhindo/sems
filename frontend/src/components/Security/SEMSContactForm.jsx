import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  User, 
  Phone, 
  MessageSquare, 
  ArrowLeft,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './SEMSContactForm.css';

const SEMSContactForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.message.trim()) errors.message = 'Message is required';

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/contact/contact', formData);
      
      if (response.data.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        setFormErrors({});
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError(response.data.message || 'Failed to send message');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Social media links
  const socialLinks = [
    { 
      icon: Facebook, 
      name: 'Facebook', 
      url: 'https://facebook.com/sems'
    },
    { 
      icon: Twitter, 
      name: 'Twitter', 
      url: 'https://twitter.com/sems'
    },
    { 
      icon: Youtube, 
      name: 'Youtube', 
      url: 'https://youtube.com/company/sems'
    },
    { 
      icon: Instagram, 
      name: 'Instagram', 
      url: 'https://instagram.com/sems'
    }
  ];

  // Back to login
  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="sems-containerCNT">
      {/* Back Button */}
      <div className="back-button-containerCNT">
        <button
          onClick={handleBackToLogin}
          className="back-buttonCNT"
        >
          <ArrowLeft className="back-button-iconCNT" />
          Back to Login
        </button>
      </div>

      {/* Header */}
      <div className="header-containerCNT">
        <h1 className="titleCNT">
          Contact <span className="title-highlightCNT">SEMS</span>
        </h1>
        <p className="subtitleCNT">
          Smart Employee Management System - We're here to help you with any inquiries
        </p>
      </div>

      {/* Main Form Section */}
      <div className="form-sectionCNT">
        <div className="form-container-mainCNT">
          {success && (
            <div className="success-messageCNT">
              <CheckCircle className="success-iconCNT" />
              <div>
                <p className="success-titleCNT">
                  Thank you for your message! We'll get back to you soon.
                </p>
                <p className="success-subtitleCNT">
                  A confirmation email has been sent to {formData.email}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-messageCNT">
              <AlertCircle className="error-iconCNT" />
              <p className="error-textCNT">{error}</p>
            </div>
          )}

          <h2 className="form-titleCNT">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="formCNT">
            <div className="form-rowCNT">
              {/* Name Field */}
              <div className="form-groupCNT">
                <label htmlFor="name" className="form-labelCNT">
                  <div className="label-icon-containerCNT">
                    <User className="label-iconCNT" />
                    Full Name *
                  </div>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`form-inputCNT ${formErrors.name ? 'input-errorCNT' : ''}`}
                  placeholder="Enter your full name"
                />
                {formErrors.name && (
                  <p className="error-textCNT">{formErrors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="form-groupCNT">
                <label htmlFor="email" className="form-labelCNT">
                  <div className="label-icon-containerCNT">
                    <Mail className="label-iconCNT" />
                    Email Address *
                  </div>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-inputCNT ${formErrors.email ? 'input-errorCNT' : ''}`}
                  placeholder="you@gmail.com"
                />
                {formErrors.email && (
                  <p className="error-textCNT">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div className="form-groupCNT">
              <label htmlFor="phone" className="form-labelCNT">
                <div className="label-icon-containerCNT">
                  <Phone className="label-iconCNT" />
                  Phone Number (Optional)
                </div>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-inputCNT"
                placeholder="+256xxxxxxxxx"
              />
            </div>

            {/* Subject Field */}
            <div className="form-groupCNT">
              <label htmlFor="subject" className="form-labelCNT">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`form-inputCNT ${formErrors.subject ? 'input-errorCNT' : ''}`}
                placeholder="What is this regarding?"
              />
              {formErrors.subject && (
                <p className="error-textCNT">{formErrors.subject}</p>
              )}
            </div>

            {/* Message Field */}
            <div className="form-groupCNT">
              <label htmlFor="message" className="form-labelCNT">
                <div className="label-icon-containerCNT">
                  <MessageSquare className="label-iconCNT" />
                  Message *
                </div>
              </label>
              <textarea
                id="message"
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleChange}
                className={`form-textareaCNT ${formErrors.message ? 'input-errorCNT' : ''}`}
                placeholder="Please provide details about your inquiry..."
              />
              {formErrors.message && (
                <p className="error-textCNT">{formErrors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="submit-button-containerCNT">
              <button
                type="submit"
                disabled={loading}
                className="submit-buttonCNT"
              >
                {loading ? (
                  <>
                    <Loader2 className="submit-button-iconCNT loading-iconCNT" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="submit-button-iconCNT" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Sections */}
      <div className="footer-sectionsCNT">
        {/* Contact Information */}
        <div className="footer-sectionCNT contact-info-footerCNT">
          <h3 className="footer-section-titleCNT">Contact Information</h3>
          
          <div className="contact-info-contentCNT">
            <div className="contact-itemCNT">
              <div className="contact-icon-containerCNT">
                <Mail className="contact-iconCNT" />
              </div>
              <div>
                <h4 className="contact-item-titleCNT">Email Support</h4>
                <p className="contact-item-textCNT">muhindomoris2003@gmail.com</p>
                <p className="contact-item-subtextCNT">Typically replies within 24-48 hours</p>
              </div>
            </div>

            <div className="business-hoursCNT">
              <h4 className="business-hours-titleCNT">Business Hours</h4>
              <div className="hours-gridCNT">
                <div className="hours-itemCNT">
                  <span>Monday - Friday</span>
                  <span className="hours-timeCNT">9:00 AM - 6:00 PM</span>
                </div>
                <div className="hours-itemCNT">
                  <span>Saturday</span>
                  <span className="hours-timeCNT">10:00 AM - 4:00 PM</span>
                </div>
                <div className="hours-itemCNT">
                  <span>Sunday</span>
                  <span className="hours-closedCNT">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="footer-sectionCNT social-media-footerCNT">
          <h3 className="footer-section-titleCNT">Follow Us</h3>
          <p className="social-subtitleCNT">
            Stay connected with SEMS updates, tips, and announcements.
          </p>
          
          <div className="social-gridCNT">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-linkCNT"
              >
                <div className="social-icon-wrapperCNT">
                  <social.icon className="social-iconCNT" />
                </div>
                <span className="social-nameCNT">{social.name}</span>
              </a>
            ))}
          </div>

        
        </div>

        {/* About SEMS */}
        <div className="footer-sectionCNT about-footerCNT">
          <h3 className="footer-section-titleCNT about">About SEMS</h3>
          <p className="about-descriptionCNT">
            Smart Employee Management System is designed to streamline HR processes, 
            improve employee engagement, and enhance workplace productivity.
          </p>
          <div className="features-listCNT">
            <div className="feature-itemCNT">
              <div className="feature-dotCNT green-dotCNT"></div>
              <span>Real-time Analytics</span>
            </div>
            <div className="feature-itemCNT">
              <div className="feature-dotCNT blue-dotCNT"></div>
              <span>Employee Self-Service</span>
            </div>
            <div className="feature-itemCNT">
              <div className="feature-dotCNT purple-dotCNT"></div>
              <span>Automated Workflows</span>
            </div>
            <div className="feature-itemCNT">
              <div className="feature-dotCNT yellow-dotCNT"></div>
              <span>Secure & Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="copyright-footerCNT">
        <p className="footer-textCNT">
          © {new Date().getFullYear()} SEMS - Smart Employee Management System. All rights reserved.
        </p>
        <p className="footer-subtextCNT">
          This contact form is secured and your information is protected.
        </p>
      </div>
    </div>
  );
};

export default SEMSContactForm;