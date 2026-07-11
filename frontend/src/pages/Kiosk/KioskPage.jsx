import { useState } from 'react';
import KioskWelcome from './KioskWelcome';
import KioskTerms from './KioskTerms';
import KioskOptions from './KioskOptions';
import KioskScan from './KioskScan';
import KioskConfirm from './KioskConfirm';
import KioskQueue from './KioskQueue';

const KioskPage = () => {
  const [step, setStep] = useState('welcome');
  const [studentData, setStudentData] = useState(null);
  const [checkinData, setCheckinData] = useState(null);
  const [scanMethod, setScanMethod] = useState(null); // 'qr' | 'manual' | 'register'

  const handleStart = () => setStep('terms');
  const handleAgree = () => setStep('options');
  const handleDecline = () => setStep('welcome');
  
  const handleScanQR = () => { setScanMethod('qr'); setStep('scan'); };
  const handleEnterID = () => { setScanMethod('manual'); setStep('scan'); };
  const handleRegister = () => { setScanMethod('register'); setStep('scan'); };
  
  const handleBack = () => {
    if (step === 'terms') setStep('welcome');
    if (step === 'options') setStep('terms');
    if (step === 'scan') setStep('options');
    if (step === 'confirm') setStep('scan');
  };
  
  const handleStudentFound = (data) => {
    setStudentData(data);
    setStep('confirm');
  };
  
  const handleCheckedIn = (data) => {
    setCheckinData(data);
    setStep('queue');
  };
  
  const handleDone = () => {
    setStep('welcome');
    setStudentData(null);
    setCheckinData(null);
    setScanMethod(null);
  };

  return (
    <>
      {step === 'welcome' && <KioskWelcome onStart={handleStart} />}
      {step === 'terms' && <KioskTerms onAgree={handleAgree} onDecline={handleDecline} onBack={handleBack} />}
      {step === 'options' && <KioskOptions onScanQR={handleScanQR} onEnterID={handleEnterID} onRegister={handleRegister} onBack={handleBack} />}
      {step === 'scan' && <KioskScan onStudentFound={handleStudentFound} onBack={handleBack} method={scanMethod} />}
      {step === 'confirm' && studentData && <KioskConfirm data={studentData} onCheckedIn={handleCheckedIn} onBack={handleBack} />}
      {step === 'queue' && checkinData && <KioskQueue checkin={checkinData} onDone={handleDone} />}
    </>
  );
};

export default KioskPage;