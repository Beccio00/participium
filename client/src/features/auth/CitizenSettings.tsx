import React, { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Form, Image, Alert, Spinner } from 'react-bootstrap';
import { PersonCircle } from 'react-bootstrap-icons';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import AccessRestricted from '../../components/AccessRestricted';
import TelegramModal from '../../components/TelegramModal';
import * as api from '../../api/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function normalizeMinioUrl(url: string | null): string | null {
  if (!url) return url;
  try {
    // quick replace for typical Docker hostnames used in dev
    if (url.includes('://minio')) {
      return url.replace('://minio', '://localhost');
    }
    // also handle hostnames like "minio:9000"
    if (url.includes('minio:')) {
      return url.replace('minio:', 'localhost:');
    }
  } catch (e) {
    // ignore
  }
  return url;
}

export default function CitizenSettings() {
  const { isAuthenticated, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getCitizenProfile();
        const u = data.user || data;
        setProfile(u);
        setFirstName(u.firstName || '');
        setLastName(u.lastName || '');
        setEmail(u.email || '');
        setEmailNotificationsEnabled(!!u.emailNotificationsEnabled);
        setPhotoPreview(normalizeMinioUrl(u.photoUrl || u.photo || null));
      } catch (err) {
        console.error('Failed to load profile', err);
        setErrorMessage('Unable to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated]);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setErrorMessage('Only image files are allowed (jpg, png, etc.).');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setErrorMessage('File is too large. Maximum size is 5 MB.');
      return;
    }
    setSelectedFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    clearMessages();
    if (!selectedFile) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('photo', selectedFile);
      const res = await api.uploadCitizenPhoto(fd);
      setSelectedFile(null);
      // Svuota il file input per sbloccare Save Changes
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // backend returns { message, photo: { id, url, filename } }
      const photoUrl = res?.photo?.url || res?.url || res?.photoUrl || (res && (res.photoUrl || res.photo?.url)) || null;
      if (photoUrl) {
        const normalized = normalizeMinioUrl(photoUrl);
        setPhotoPreview(normalized);
        setProfile((prev: any) => ({ ...(prev || {}), photo: normalized, photoUrl: normalized }));
        // refresh auth user so header picks up new photo immediately
        try { await refreshUser(); } catch (e) { /* ignore */ }
      }
      setSuccessMessage('Profile photo uploaded successfully.');
    } catch (err) {
      console.error('Upload failed', err);
      // try to show backend error if available
      const backendMsg = (err as any)?.body?.message || (err as any)?.body?.error;
      const msg = backendMsg || (err as any)?.message || 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Ripristina preview alla foto del profilo o null
    if (profile) {
      setPhotoPreview(normalizeMinioUrl(profile.photoUrl || profile.photo || null));
    } else {
      setPhotoPreview(null);
    }
  };

  const handleDeletePhoto = async () => {
    clearMessages();
    // Elimina solo se c'è una foto già sul server
    if (!profile?.photoUrl && !profile?.photo) {
      setErrorMessage('No photo to delete.');
      return;
    }
    try {
      setSaving(true);
      await api.deleteCitizenPhoto();
      setPhotoPreview(null);
      setProfile((prev: any) => ({ ...(prev || {}), photo: null, photoUrl: null }));
      setSuccessMessage('Profile photo removed.');
      try { await refreshUser(); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Delete photo failed', err);
      setErrorMessage('Could not delete photo. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearMessages();
    // Password validation
    if ((newPassword || confirmPassword) && newPassword !== confirmPassword) {
      setErrorMessage('Password and confirmation do not match.');
      return;
    }
    if (newPassword && newPassword.length > 0 && newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        firstName,
        lastName,
        email,
        emailNotificationsEnabled,
      };
      if (newPassword) payload.password = newPassword;
      const res = await api.updateCitizenConfig(payload);
      setSuccessMessage('Account settings updated successfully.');
      // If backend returned the updated user, use it to update local copy
      if (res && typeof res === 'object') {
        const updatedUser = (res.user || res);
        setProfile((prev: any) => ({ ...(prev || {}), ...(updatedUser || {}), firstName, lastName, email, emailNotificationsEnabled }));
        // if response contains photo info, update preview
        const photoUrl = (updatedUser && (updatedUser.photoUrl || updatedUser.photo)) || null;
        if (photoUrl) setPhotoPreview(normalizeMinioUrl(photoUrl));
      } else {
        setProfile((prev: any) => ({ ...(prev || {}), firstName, lastName, email, emailNotificationsEnabled }));
      }
      // refresh auth user so header reflects updates
      try { await refreshUser(); } catch (e) { /* ignore */ }
      // exit edit mode
      setEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Save config failed', err);
      const backendMsg = (err as any)?.body?.message || (err as any)?.body?.error;
      const msg = backendMsg || (err as any)?.message || 'Failed to save settings. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const enterEditMode = () => {
    clearMessages();
      if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setEmail(profile.email || '');
      setEmailNotificationsEnabled(!!profile.emailNotificationsEnabled);
      setPhotoPreview(normalizeMinioUrl(profile.photoUrl || profile.photo || null));
    }
    setNewPassword('');
    setConfirmPassword('');
    setEditing(true);
  };

  if (loading) return (
    <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
      <Spinner animation="border" />
    </div>
  );

  if (!isAuthenticated) {
    return <AccessRestricted message="You need to be logged in as a citizen to access your settings." showLoginButton={true} />;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Account settings</h2>
            <p className="text-muted mb-0">Manage your profile, notifications and profile photo.</p>
          </div>

              {successMessage && <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>{successMessage}</Alert>}
              {errorMessage && <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>{errorMessage}</Alert>}

              <Row className="g-4">
                {/* Left column: avatar - always visible */}
                <Col xs={12} md={4} className="d-flex flex-column align-items-center" style={{ paddingRight: '2rem' }}>
                  <div className="text-center mb-2">
                    {photoPreview ? (
                      <Image src={photoPreview} roundedCircle width={120} height={120} alt="profile" style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(169, 172, 176, 1)' }}>
                        <PersonCircle size={56} style={{ color: 'rgba(169, 172, 176, 1)' }} />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 w-100 d-flex flex-column align-items-center">
                    {editing ? (
                      <>
                        <Form.Control type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
                        <div className="d-flex w-100 mt-2">
                          <Button variant="primary" onClick={handleUpload} disabled={!selectedFile || saving} className="flex-fill">{saving ? 'Uploading...' : 'Upload'}</Button>
                        </div>
                        <div className="d-flex gap-2 mt-2 w-100">
                          <Button variant="secondary" onClick={handleClearFile} disabled={!selectedFile || saving} className="flex-fill">Clear</Button>
                          <Button variant="danger" onClick={handleDeletePhoto} disabled={(!profile?.photoUrl && !profile?.photo) || !!selectedFile || saving} className="flex-fill">Delete</Button>
                        </div>
                        <small className="text-muted mt-2">Max size: 5 MB. Allowed: JPG, PNG.</small>
                      </>
                    ) : null}
                  </div>
                </Col>

                {/* Right column: either summary (view) or edit form */}
                <Col xs={12} md={8}>
                  {!editing ? (
                    <div className="mb-3">
                      <Row className="mb-2">
                        <Col xs={12} md={4} className="text-muted">First name</Col>
                        <Col xs={12} md={8}>{firstName || <span className="text-muted">—</span>}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={12} md={4} className="text-muted">Last name</Col>
                        <Col xs={12} md={8}>{lastName || <span className="text-muted">—</span>}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={12} md={4} className="text-muted">Email</Col>
                        <Col xs={12} md={8}>{email || <span className="text-muted">—</span>}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={12} md={4} className="text-muted">Password</Col>
                        <Col xs={12} md={8}><span aria-hidden>••••••••</span></Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={12} md={4} className="text-muted">Telegram</Col>
                        <Col xs={12} md={8}>{profile?.telegramUsername ? ('@' + profile.telegramUsername) : <span className="text-muted">Not connected</span>}</Col>
                      </Row>
                      <div className="mt-4">
                        <Button variant="primary" onClick={enterEditMode}>Modify</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Row className="mb-4">
                        <Col xs={12} md={6}>
                          <Input
                            label="First name"
                            value={firstName}
                            onChange={(e: any) => setFirstName(e.target.value)}
                          />
                        </Col>
                        <Col xs={12} md={6}>
                          <Input
                            label="Last name"
                            value={lastName}
                            onChange={(e: any) => setLastName(e.target.value)}
                          />
                        </Col>
                      </Row>

                      <div className="mb-4">
                        <Input
                          label="Email address"
                          type="email"
                          value={email}
                          onChange={(e: any) => setEmail(e.target.value)}
                          helperText="Your email is used for notifications and login"
                        />
                      </div>

                      <Form.Group className="mb-4">
                        <div className="form-label">Telegram</div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="text-muted">{profile?.telegramUsername ? ('@' + profile.telegramUsername) : 'Not connected'}</span>
                          <Button className="outline-primary" size="sm" onClick={() => setShowTelegramModal(true)}>Manage</Button>
                        </div>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Check
                          type="switch"
                          id="email-notifications-switch"
                          label="Email notifications"
                          checked={emailNotificationsEnabled}
                          onChange={(e: any) => setEmailNotificationsEnabled(e.target.checked)}
                        />
                        <Form.Text className="text-muted d-block mt-2">Enable or disable email notifications for report updates.</Form.Text>
                      </Form.Group>

                      <Row className="mb-4">
                        <Col xs={12} md={6}>
                          <Input
                            label="New password"
                            type="password"
                            value={newPassword}
                            onChange={(e: any) => setNewPassword(e.target.value)}
                            helperText="Leave empty to keep current"
                          />
                        </Col>
                        <Col xs={12} md={6}>
                          <Input
                            label="Confirm password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e: any) => setConfirmPassword(e.target.value)}
                          />
                        </Col>
                      </Row>

                      {selectedFile ? (
                        <div className="mb-1">
                          <small className="text-muted">You must upload or clear the profile picture before saving changes</small>
                        </div>
                      ) : null}

                      <div className="d-flex gap-2 align-items-center">
                        <Button type="button" variant="primary" isLoading={saving} onClick={handleSaveConfig} disabled={!!selectedFile || saving}>Save changes</Button>
                        <Button variant="secondary" onClick={() => {
                          // cancel edits and restore values
                          setSuccessMessage(null);
                          setErrorMessage(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                          if (profile) {
                            setFirstName(profile.firstName || '');
                            setLastName(profile.lastName || '');
                            setEmail(profile.email || '');
                            setEmailNotificationsEnabled(!!profile.emailNotificationsEnabled);
                            setPhotoPreview(normalizeMinioUrl(profile.photoUrl || profile.photo || null));
                          }
                          setNewPassword('');
                          setConfirmPassword('');
                          setEditing(false);
                        }}>Cancel</Button>
                      </div>
                    </>
                  )}
                </Col>
              </Row>

          <TelegramModal show={showTelegramModal} onHide={() => setShowTelegramModal(false)} />
        </Col>
      </Row>
    </Container>
  );
}
