import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, HelpCircle, ChevronDown } from 'lucide-react';

// FAQ and knowledge base about the PUP CareLink system
const FAQ_DATA = [
  {
    category: 'General',
    questions: [
      { q: 'What is PUP CareLink?', a: 'PUP CareLink is a digital clinic management system for PUP Bansud Campus that allows students to book appointments, manage health records, and stay connected with the school clinic.' },
      { q: 'How do I get started?', a: 'After registering, complete your Health Profile first to unlock all features like booking appointments and viewing health records.' },
      { q: 'Is my data secure?', a: 'Yes! Your health information is protected and only accessible to you and authorized clinic staff.' }
    ]
  },
  {
    category: 'Appointments',
    questions: [
      { q: 'How to book an appointment?', a: 'Go to Appointments, click Book, select service, date, and time.' },
      { q: 'How to cancel an appointment?', a: 'Go to Appointments, find your pending appointment, click Cancel. Note: You can only cancel pending appointments.' },
      { q: 'Can I reschedule?', a: 'Currently, you need to cancel your existing appointment and book a new one. Reschedule feature coming soon!' },
      { q: 'What services are available?', a: 'Services include: General Consultation, Medical Certificate requests, Health Check-ups, and Emergency care.' }
    ]
  },
  {
    category: 'QR Code',
    questions: [
      { q: 'What is My QR Code for?', a: 'Your QR Code is used for quick clinic check-in at the kiosk. Just scan it at the self-service kiosk when you arrive.' },
      { q: 'How to use the QR at the kiosk?', a: 'Go to the clinic kiosk, select Check-in, scan your QR code, confirm your appointment. Done!' },
      { q: 'Can I share my QR code?', a: 'No! Your QR code is unique to you. Sharing it may allow others to check in under your name.' }
    ]
  },
  {
    category: 'Health Records',
    questions: [
      { q: 'How to view my health records?', a: 'Go to Health Records in the sidebar to view your consultation history, prescriptions, and medical certificates.' },
      { q: 'How to complete my health profile?', a: 'Go to Health Profile, fill out all required fields (medical history, allergies, emergency contact), then submit.' },
      { q: 'Can I edit my health profile?', a: 'Yes! Go to Health Profile, click Edit, update your information, and save changes.' }
    ]
  },
  {
    category: 'Account',
    questions: [
      { q: 'How to update my profile?', a: 'Go to Profile, click Edit Profile, update your information, and save.' },
      { q: 'How to change my password?', a: 'Go to Settings, then Security, then Change Password. Enter your current password and new password.' },
      { q: 'I forgot my password', a: 'Click Forgot Password on the login page, enter your email, check your email for the reset link.' }
    ]
  },
  {
    category: 'Notifications',
    questions: [
      { q: 'How do I get appointment updates?', a: "You will receive notifications for appointment confirmations, reminders, and updates. Check the Alerts section." },
      { q: 'What are announcements?', a: 'Announcements are important updates from the clinic about schedules, health advisories, and events.' }
    ]
  },
  {
    category: 'Health & Wellness',
    questions: [
      { q: 'What is the Health Assistant?', a: 'The Health Assistant provides general wellness guidance for common mild symptoms. It does not replace professional medical advice. Always consult the clinic for persistent or severe symptoms.' },
      { q: 'When should I visit the clinic?', a: 'Visit the clinic if symptoms worsen, persist beyond a few days, or if you experience severe pain, difficulty breathing, high fever, or any other concerning symptoms.' },
      { q: 'Can the chatbot diagnose me?', a: 'No. The chatbot only provides general wellness information. It cannot diagnose conditions or prescribe medication. Always consult a healthcare professional for proper evaluation.' }
    ]
  }
];

// ============================================================
// HEALTH ASSISTANT — GREEN / LOW-URGENCY CASES (PHASE 1)
// ============================================================
const HEALTH_RESPONSES = {
  headache: {
    keywords: ['headache', 'sakit ulo', 'sakit ng ulo', 'masakit ulo', 'masakit ang ulo', 'head pain', 'ulanging', 'migraine'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang sakit ng ulo?\n- Mild, moderate, o severe ba ang sakit?\n- Nakainom ka ba ng sapat na tubig?\n- Nakakain ka ba nang maayos?\n- Nakapagpahinga o nakatulog ka ba nang sapat?\n- May fever, pagsusuka, panghihina, pamamanhid, panlalabo ng paningin, confusion, o hirap magsalita ba?",
    mild: "Based on your description, your headache appears to be mild.\n\nPossible causes may include:\n- Lack of sleep or fatigue\n- Dehydration\n- Eye strain from screen use\n- Stress or tension\n- Skipping meals\n\nGeneral self-care you can try:\n- Rest in a quiet, dimly lit environment\n- Drink adequate water or fluids\n- Eat a proper meal if you haven't eaten\n- Reduce screen time and take breaks\n- Get adequate rest and sleep\n\nThings to monitor:\n- If the headache worsens or becomes severe\n- If it persists beyond 24-48 hours\n- If accompanied by fever, vomiting, or vision changes\n\nVisit the clinic if:\n- The headache becomes severe or unbearable\n- It is accompanied by high fever, stiff neck, confusion, or vision changes\n- It does not improve with rest and hydration\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  cold: {
    keywords: ['cold', 'sipon', 'runny nose', 'nose drip', 'baradong ilong', 'clogged nose', 'congestion', 'congested', 'trangkaso'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang sipon?\n- May kasamang fever, ubo, o sakit ng lalamunan ba?\n- Nakakain at nakainom ka ba nang maayos?\n- Nakapagpahinga ka ba nang sapat?",
    mild: "Based on your description, your symptoms appear to be mild.\n\nPossible causes may include:\n- Common viral infection\n- Exposure to cold weather or allergens\n- Fatigue or weakened immunity\n\nGeneral self-care you can try:\n- Drink plenty of warm fluids (water, tea, soup)\n- Get adequate rest and sleep\n- Keep yourself warm\n- Eat nutritious foods to support your immune system\n- Gargle with warm salt water if you have a sore throat\n\nThings to monitor:\n- If fever develops or worsens\n- If symptoms persist beyond 7-10 days\n- If you experience difficulty breathing\n\nVisit the clinic if:\n- You develop high fever (above 38.5°C)\n- Symptoms worsen or do not improve after a week\n- You experience difficulty breathing or chest pain\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  cough: {
    keywords: ['cough', 'ubo', 'nag-uubo', 'ubo-ubo', 'dry cough', 'wet cough', 'productive cough'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang ubo?\n- May plema o walang plema?\n- May kasamang fever, sipon, o hirang huminga ba?\n- Nakainom ka ba ng sapat na tubig?",
    mild: "Based on your description, your cough appears to be mild.\n\nPossible causes may include:\n- Common cold or post-nasal drip\n- Dry air or irritation\n- Mild throat irritation\n- Allergies\n\nGeneral self-care you can try:\n- Drink plenty of warm fluids\n- Avoid cold drinks and irritants (smoke, dust)\n- Get adequate rest\n- Use a humidifier if available\n- Honey (if not diabetic) may help soothe the throat\n\nThings to monitor:\n- If cough persists beyond 2-3 weeks\n- If you develop fever or difficulty breathing\n- If you cough up blood\n\nVisit the clinic if:\n- The cough lasts more than 3 weeks\n- You develop high fever or difficulty breathing\n- You cough up blood or experience chest pain\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  soreThroat: {
    keywords: ['sore throat', 'sakit lalamunan', 'sakit ng lalamunan', 'masakit lalamunan', 'hirap lumunom', 'painful swallowing', 'lalamunan'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang sakit ng lalamunan?\n- May kasamang fever, ubo, o sipon ba?\n- Nakakain at nakakainom ka ba nang maayos?\n- May pamamaga ng glands sa leeg ba?",
    mild: "Based on your description, your sore throat appears to be mild.\n\nPossible causes may include:\n- Common viral infection\n- Dry air or irritation\n- Post-nasal drip\n- Mild bacterial infection\n\nGeneral self-care you can try:\n- Gargle with warm salt water several times a day\n- Drink warm fluids (tea with honey, warm water)\n- Avoid cold drinks and irritants\n- Get adequate rest\n- Suck on throat lozenges if available\n\nThings to monitor:\n- If pain worsens or makes swallowing impossible\n- If high fever develops\n- If white patches appear on the tonsils\n\nVisit the clinic if:\n- The pain becomes severe or prevents eating/drinking\n- You develop high fever\n- Symptoms persist beyond 5-7 days\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  fatigue: {
    keywords: ['fatigue', 'pagod', 'sobrang pagod', 'tired', 'pagod na pagod', 'walang energy', 'low energy', 'lacking energy', 'panghihina', 'weak'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang pakiramdam ng pagod?\n- Nakatulog ka ba nang sapat (7-8 hours)?\n- Nakakain ka ba nang maayos at regular?\n- May kasamang ibang sintomas ba tulad ng fever o pananakit?",
    mild: "Based on your description, your fatigue appears to be mild.\n\nPossible causes may include:\n- Lack of adequate sleep\n- Poor nutrition or skipping meals\n- Stress or mental fatigue\n- Dehydration\n- Prolonged screen time\n\nGeneral self-care you can try:\n- Get 7-9 hours of quality sleep\n- Eat regular, balanced meals\n- Stay hydrated throughout the day\n- Take short breaks from studying or screen time\n- Engage in light physical activity (short walk)\n\nThings to monitor:\n- If fatigue persists despite adequate rest\n- If accompanied by fever, weight loss, or other symptoms\n- If it significantly affects your daily activities\n\nVisit the clinic if:\n- Fatigue persists beyond 2 weeks despite rest\n- You experience unexplained weight loss\n- You have other concerning symptoms like fever or dizziness\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  eyeStrain: {
    keywords: ['eye strain', 'sakit mata', 'sakit ng mata', 'masakit mata', 'pagod mata', 'tired eyes', 'blurry vision', 'panlalabo', 'dry eyes', 'mata'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang sakit o pagod ng mata?\n- Ilang oras ka nang nagscscreen?\n- May panlalabo, pagpula, o pagtatae ng mata ba?\n- Nakapagpahinga ka ba nang mula sa screen?",
    mild: "Based on your description, your eye strain appears to be mild.\n\nPossible causes may include:\n- Prolonged screen time\n- Poor lighting while studying\n- Inadequate blinking\n- Uncorrected vision problems\n- Dry environment\n\nGeneral self-care you can try:\n- Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds\n- Adjust screen brightness and position\n- Use proper lighting when studying\n- Blink frequently to keep eyes moist\n- Take regular breaks from screens\n- Apply warm compress if eyes feel tired\n\nThings to monitor:\n- If vision changes persist or worsen\n- If you experience eye pain, redness, or discharge\n- If headaches accompany the eye strain\n\nVisit the clinic if:\n- Vision changes persist or worsen\n- You experience severe eye pain or redness\n- You notice discharge from the eyes\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  musclePain: {
    keywords: ['muscle pain', 'sakit kalamnan', 'sakit ng kalamnan', 'masakit kalamnan', 'body pain', 'pananakit ng katawan', 'muscle ache', 'aching muscles', 'masakit katawan'],
    followUp: "To help you better, please tell me:\n- Aling bahagi ng katawan ang masakit?\n- Gaano na katagal ang sakit?\n- May naunang physical activity o exercise ba?\n- May pamamaga, panghihina, o ibang kasamang sintomas ba?",
    mild: "Based on your description, your muscle pain appears to be mild.\n\nPossible causes may include:\n- Overuse or strenuous activity\n- Poor posture during study or sleep\n- Dehydration\n- Stress or tension\n- Lack of stretching\n\nGeneral self-care you can try:\n- Rest the affected muscle\n- Apply warm or cold compress as needed\n- Gentle stretching if not too painful\n- Stay hydrated\n- Maintain good posture while studying\n\nThings to monitor:\n- If pain worsens or spreads\n- If swelling or redness develops\n- If you experience weakness or numbness\n\nVisit the clinic if:\n- The pain becomes severe or unbearable\n- You notice significant swelling or bruising\n- You cannot move the affected area\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  backPain: {
    keywords: ['back pain', 'sikat likod', 'sakit ng likod', 'masakit likod', 'lower back', 'upper back', 'likod'],
    followUp: "To help you better, please tell me:\n- Aling bahagi ng likod ang masakit (itaas o ibaba)?\n- Gaano na katagal ang sakit?\n- May naunang physical activity o pagbuhat ng mabigat ba?\n- Nakapagpahinga ka ba nang maayos?",
    mild: "Based on your description, your back pain appears to be mild.\n\nPossible causes may include:\n- Poor posture while sitting or studying\n- Prolonged sitting without breaks\n- Muscle strain from activity\n- Carrying heavy bags\n- Inadequate sleep or rest\n\nGeneral self-care you can try:\n- Maintain proper posture while sitting\n- Take breaks and stretch every 30-60 minutes\n- Apply warm compress to the affected area\n- Avoid heavy lifting\n- Sleep on a firm, comfortable surface\n- Gentle stretching exercises\n\nThings to monitor:\n- If pain radiates to the legs\n- If you experience numbness or tingling\n- If pain worsens with movement\n\nVisit the clinic if:\n- The pain becomes severe or radiates to other areas\n- You experience numbness, tingling, or weakness\n- The pain persists beyond 1-2 weeks\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  bruise: {
    keywords: ['bruise', 'pasa', 'may pasa', 'pasa sa katawan', 'bruising', 'black and blue', 'pangitim-itim'],
    followUp: "To help you better, please tell me:\n- Saan bahagi ng katawan ang pasa?\n- Paano ito nangyari (nadama mo ba ang pagkabangga)?\n- Gaano kalaki ang pasa?\n- May ibang sintomas ba tulad ng pamamaga o matinding sakit?",
    mild: "Based on your description, your bruise appears to be minor.\n\nPossible causes may include:\n- Minor bump or impact\n- Pressure on the skin\n- Minor injury during activity\n\nGeneral self-care you can try:\n- Apply cold compress for the first 24-48 hours (15-20 minutes at a time)\n- After 48 hours, switch to warm compress to promote healing\n- Rest the affected area\n- Elevate the bruised area if possible\n\nThings to monitor:\n- If the bruise grows significantly in size\n- If pain worsens instead of improving\n- If you develop bruises without known cause\n\nVisit the clinic if:\n- The bruise is very large or very painful\n- You develop bruises frequently without known cause\n- You experience swelling that does not improve\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  menstrualCramps: {
    keywords: ['menstrual cramps', 'dysmenorrhea', 'sakit ng tiyan', 'cramps', 'menstruation', 'period', 'regla', 'sakit sa baba', 'monthly period', 'panregla'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang cramps?\n- Mild, moderate, o severe ba ang sakit?\n- Normal ba ang iyong menstrual flow?\n- May ibang kasamang sintomas ba tulad ng sobrang pagod o pagkahilo?",
    mild: "Based on your description, your menstrual cramps appear to be mild.\n\nPossible causes may include:\n- Normal uterine contractions during menstruation\n- Hormonal changes\n- Stress or fatigue\n\nGeneral self-care you can try:\n- Apply warm compress to the lower abdomen\n- Gentle stretching or light exercise\n- Stay hydrated\n- Get adequate rest\n- Avoid caffeine and salty foods\n- Gentle abdominal massage\n\nThings to monitor:\n- If pain becomes severe and unmanageable\n- If bleeding is unusually heavy\n- If you experience fever or other concerning symptoms\n\nVisit the clinic if:\n- The pain becomes severe and does not improve\n- You experience unusually heavy bleeding\n- You have fever or other concerning symptoms\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  minorCuts: {
    keywords: ['cut', 'hiwa', 'may hiwa', 'hiwa sa balat', 'minor cut', 'small cut', 'scratch', 'gasgas', 'galos', 'sugat'],
    followUp: "To help you better, please tell me:\n- Saan bahagi ng katawan ang sugat?\n- Gaano kalalim o kalaki ang sugat?\n- Tumutulo pa ba ang dugo o tumigil na?\n- Paano ito nangyari?",
    mild: "Based on your description, your cut appears to be minor.\n\nGeneral self-care you can try:\n- Wash your hands before handling the wound\n- Clean the wound gently with clean water\n- Apply gentle pressure with a clean cloth to stop any bleeding\n- Apply antiseptic if available\n- Cover with a clean bandage or dressing\n- Change the bandage daily or when wet/dirty\n\nThings to monitor:\n- If bleeding does not stop after 10 minutes of pressure\n- If signs of infection appear (redness, swelling, pus, warmth)\n- If the wound opens up or worsens\n\nVisit the clinic if:\n- The cut is deep or gaping\n- Bleeding does not stop with pressure\n- You see signs of infection\n- The wound was caused by a dirty or rusty object\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  nosebleed: {
    keywords: ['nosebleed', 'pagdugo ng ilong', 'bleeding nose', 'dugo sa ilong', 'nose bleed', 'pagdurugo ng ilong'],
    followUp: "To help you better, please tell me:\n- Tumigil na ba ang pagdugo?\n- Gaano katagal bago ito tumigil?\n- Madalas ba itong mangyari?\n- May kasamang ibang sintomas ba?",
    mild: "Based on your description, your nosebleed appears to have stopped and is likely minor.\n\nGeneral self-care for future nosebleeds:\n- Sit upright and lean slightly forward\n- Pinch the soft part of the nose for 10-15 minutes\n- Breathe through your mouth\n- Apply cold compress to the bridge of the nose\n- Avoid blowing your nose for several hours\n- Keep your head elevated\n\nThings to monitor:\n- If nosebleeds become frequent\n- If bleeding lasts longer than 20 minutes\n- If accompanied by dizziness or weakness\n\nVisit the clinic if:\n- Bleeding does not stop after 20 minutes of pressure\n- Nosebleeds occur frequently\n- You feel dizzy, weak, or faint\n- The nosebleed follows a head injury\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  nausea: {
    keywords: ['nausea', 'nauseous', 'pagkahilo', 'hilo', 'naghihiwalay', 'sick to stomach', 'ayaw kain', 'walang gana', 'nagsusuka', 'vomiting', 'suka'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang pakiramdam ng nausea?\n- Nakakain ka ba nang maayos?\n- Nakainom ka ba ng sapat na tubig?\n- May kasamang fever, pananakit ng tiyan, o pagtatae ba?",
    mild: "Based on your description, your nausea appears to be mild.\n\nPossible causes may include:\n- Motion sickness\n- Food-related issues\n- Stress or anxiety\n- Fatigue\n- Mild stomach upset\n\nGeneral self-care you can try:\n- Sip small amounts of water or clear fluids\n- Eat small, bland meals (crackers, toast, rice)\n- Avoid greasy, spicy, or strong-smelling foods\n- Get fresh air\n- Rest in a comfortable position\n- Avoid lying down immediately after eating\n\nThings to monitor:\n- If nausea persists beyond 24 hours\n- If you cannot keep fluids down\n- If you develop severe abdominal pain\n- If signs of dehydration appear\n\nVisit the clinic if:\n- Nausea persists beyond 24-48 hours\n- You cannot keep any fluids down\n- You experience severe abdominal pain\n- You show signs of dehydration\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  },
  diarrhea: {
    keywords: ['diarrhea', 'pagtatae', 'nagtatae', 'loose bowel', 'frequent bowel', 'watery stool', 'stomach upset', 'tiyan'],
    followUp: "To help you better, please tell me:\n- Gaano na katagal ang pagtatae?\n- Ilang beses ka nang dumudumi sa isang araw?\n- Nakainom ka ba ng sapat na tubig?\n- May kasamang fever, matinding pananakit ng tiyan, o dugo sa dumi ba?",
    mild: "Based on your description, your diarrhea appears to be mild.\n\nPossible causes may include:\n- Food-related issues\n- Mild infection\n- Stress or anxiety\n- Dietary changes\n\nGeneral self-care you can try:\n- Drink plenty of fluids (water, oral rehydration solution, clear broth)\n- Eat bland, easy-to-digest foods (BRAT diet: bananas, rice, applesauce, toast)\n- Avoid dairy, fatty, and spicy foods\n- Get adequate rest\n- Maintain good hygiene (handwashing)\n\nThings to monitor:\n- If diarrhea persists beyond 2-3 days\n- If you develop signs of dehydration (dry mouth, dizziness, decreased urination)\n- If you have high fever or blood in stool\n\nVisit the clinic if:\n- Diarrhea persists beyond 3 days\n- You show signs of dehydration\n- You have high fever or blood in stool\n- You experience severe abdominal pain\n\nDisclaimer: This is general wellness information only and does not replace professional medical advice. Always consult a healthcare provider for persistent or severe symptoms."
  }
};

// Health keyword detection - returns follow-up questions for mild cases
const getHealthResponse = (input) => {
  const lower = input.toLowerCase().trim();
  for (const [condition, data] of Object.entries(HEALTH_RESPONSES)) {
    const isMatch = data.keywords.some(keyword => lower.includes(keyword));
    if (isMatch) {
      return data.followUp;
    }
  }
  return null;
};

// Check if input contains health-related keywords
const isHealthQuery = (input) => {
  const lower = input.toLowerCase().trim();
  return Object.values(HEALTH_RESPONSES).some(data =>
    data.keywords.some(keyword => lower.includes(keyword))
  );
};

// Keyword matching for AI-like responses
const getAIResponse = (input) => {
  const lower = input.toLowerCase().trim();

  // Check for health-related queries first (GREEN cases)
  if (isHealthQuery(lower)) {
    const healthResponse = getHealthResponse(lower);
    if (healthResponse) {
      return healthResponse;
    }
  }

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo)/i.test(lower)) {
    return "Hello! I am CareLink Assistant. How can I help you today? You can ask me about appointments, QR codes, health records, or any other feature!";
  }
  if (/^(thank|thanks|ty|thank\s*you)/i.test(lower)) {
    return "You are welcome! Is there anything else I can help you with?";
  }
  if (/^(bye|goodbye|see\s*you|later)/i.test(lower)) {
    return "Goodbye! Do not hesitate to come back if you have more questions. Take care!";
  }
  if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
    if (lower.includes('cancel')) {
      return "To cancel an appointment: Go to Appointments, find your pending appointment, click Cancel. Note: Only pending appointments can be cancelled.";
    }
    if (lower.includes('reschedule')) {
      return "To reschedule: Currently you need to cancel your existing appointment and book a new one. A direct reschedule feature is coming soon!";
    }
    return "To book an appointment: 1. Go to Appointments. 2. Click Book Appointment. 3. Select a service (Consultation, Medical Certificate, etc.). 4. Choose your preferred date and time. 5. Click Submit. You will receive a notification once it is confirmed!";
  }
  if (lower.includes('qr') || lower.includes('code') || lower.includes('scan') || lower.includes('kiosk')) {
    return "Your QR Code is used for quick clinic check-in! 1. Go to My QR Code in the sidebar. 2. Show your QR at the clinic kiosk. 3. Scan it to check in automatically. Never share your QR code, it is unique to you!";
  }
  if (lower.includes('health') && (lower.includes('profile') || lower.includes('record') || lower.includes('medical'))) {
    if (lower.includes('edit') || lower.includes('update') || lower.includes('change')) {
      return "To update your health profile: 1. Go to Health Profile. 2. Click Edit. 3. Update your information. 4. Click Save.";
    }
    return "Your Health Profile contains your medical history, allergies, and emergency contacts. To complete it: Go to Health Profile, fill out all required fields, then submit. Completing your health profile unlocks all appointment features!";
  }
  if (lower.includes('password') || lower.includes('forgot') || lower.includes('login') || lower.includes('sign')) {
    if (lower.includes('forgot') || lower.includes('reset')) {
      return "Forgot your password? 1. Go to the Login page. 2. Click Forgot Password. 3. Enter your email address. 4. Check your email for the reset link. 5. Create a new password.";
    }
    return "To change your password: 1. Go to Settings, then Security. 2. Enter your current password. 3. Enter your new password. 4. Confirm and save.";
  }
  if (lower.includes('service') || lower.includes('consultation') || lower.includes('medical') || lower.includes('certificate')) {
    return "Available clinic services: General Consultation (talk to the school nurse), Medical Certificate (request medical documents), Health Check-up (routine health monitoring), Emergency Care (urgent medical attention). Book any service through the Appointments page!";
  }
  if (lower.includes('notif') || lower.includes('alert') || lower.includes('announce')) {
    return "Stay updated! Alerts: Appointment confirmations, reminders, and status updates. Announcements: Important clinic news, schedules, and health advisories. Check the notification bell in the header for unread counts!";
  }
  if (lower.includes('contact') || lower.includes('call') || lower.includes('visit') || lower.includes('clinic') || lower.includes('location')) {
    return "Visit the Clinic: PUP Bansud Campus. Call: (043) 123-4567. You can also send messages through the system notification feature!";
  }
  if (lower.includes('dark') || lower.includes('theme') || lower.includes('mode')) {
    return "To toggle dark/light mode: Click the sun/moon icon in the top-right corner of the header. Your preference is saved automatically!";
  }
  if (lower.includes('help') || lower.includes('how') || lower.includes('what can')) {
    return "I can help you with: Booking/cancelling appointments, using your QR code, health profile and records, account and password, notifications and alerts, clinic services and contact. Just ask me anything about the system!";
  }
  return "I am not sure I understand that completely. Try asking about: How to book an appointment, how to use my QR code, how to update my health profile, how to change my password, clinic services and contact info. Or browse the FAQ topics below!";
};

const Chatbot = ({ userType = 'student' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hour = new Date().getHours();
      let greeting = 'Hello';
      if (hour < 12) greeting = 'Good Morning';
      else if (hour < 18) greeting = 'Good Afternoon';
      else greeting = 'Good Evening';
      setMessages([{ id: 1, type: 'bot', text: `${greeting}! I am your CareLink Assistant. I can help you with appointments, QR codes, health records, and more. Ask me anything or browse the FAQs below!`, timestamp: new Date() }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 300); }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { id: Date.now(), type: 'user', text: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setShowFaq(false);
    setIsTyping(true);
    setTimeout(() => {
      const botMessage = { id: Date.now() + 1, type: 'bot', text: getAIResponse(currentInput), timestamp: new Date() };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  const handleFaqClick = (question, answer) => {
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: question, timestamp: new Date() }]);
    setShowFaq(false);
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: answer, timestamp: new Date() }]);
      setIsTyping(false);
    }, 500);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatMessage = (text) => text.split('\n').map((line, i) => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="block" />;
  });

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-[#7A0019] to-[#5C0013] hover:from-[#8B0019] hover:to-[#6C0013] transition-all duration-300"
            style={{ boxShadow: '0 8px 32px rgba(122, 0, 25, 0.4)' }}
          >
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute inset-0 rounded-full bg-[#7A0019] animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden shadow-2xl border ${darkMode ? 'bg-gray-900 border-gray-700/50 shadow-black/40' : 'bg-white border-gray-200 shadow-gray-300/50'}`}
            style={{ height: '560px', maxHeight: 'calc(100vh - 3rem)' }}
          >
            <div className="bg-gradient-to-r from-[#7A0019] to-[#5C0013] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">CareLink Assistant</h3>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white/70 text-xs">Online - Ready to help</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`} style={{ height: 'calc(100% - 140px)' }}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end space-x-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-[#7A0019] text-white' : darkMode ? 'bg-gray-700 text-maroon-400' : 'bg-maroon-50 text-maroon-700'}`}>
                      {msg.type === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.type === 'user' ? 'bg-[#7A0019] text-white rounded-br-md' : darkMode ? 'bg-gray-800 text-gray-200 rounded-bl-md border border-gray-700/50' : 'bg-white text-gray-700 rounded-bl-md border border-gray-100 shadow-sm'}`}>
                      {formatMessage(msg.text)}
                      <span className={`text-[10px] mt-1 block ${msg.type === 'user' ? 'text-white/50' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end space-x-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700 text-maroon-400' : 'bg-maroon-50 text-maroon-700'}`}>
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${darkMode ? 'bg-gray-800 border border-gray-700/50' : 'bg-white border border-gray-100 shadow-sm'}`}>
                    <div className="flex space-x-1.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              {showFaq && messages.length <= 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-2">
                  <div className={`flex items-center space-x-2 mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Frequently Asked Questions</span>
                  </div>
                  {FAQ_DATA.map((category, catIdx) => (
                    <div key={catIdx} className="mb-2">
                      <button onClick={() => setExpandedCategory(expandedCategory === catIdx ? null : catIdx)} className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} ${expandedCategory === catIdx ? (darkMode ? 'bg-gray-800' : 'bg-gray-100') : ''}`}>
                        <span className="text-xs font-semibold">{category.category}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedCategory === catIdx ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {expandedCategory === catIdx && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="pt-1 pb-1 space-y-1">
                              {category.questions.map((faq, qIdx) => (
                                <button key={qIdx} onClick={() => handleFaqClick(faq.q, faq.a)} className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-700'}`}>
                                  <span className="flex items-center space-x-2">
                                    <HelpCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{faq.q}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={`px-4 py-3 border-t ${darkMode ? 'bg-gray-900 border-gray-700/50' : 'bg-white border-gray-100'}`}>
              <div className={`flex items-center space-x-2 rounded-2xl px-3 py-1.5 ${darkMode ? 'bg-gray-800 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'}`}>
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Ask me anything..." className={`flex-1 bg-transparent text-sm outline-none placeholder-gray-400 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
                <button onClick={handleSend} disabled={!input.trim()} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-[#7A0019] text-white hover:bg-[#8B0019] shadow-md' : darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'}`}>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className={`text-[10px] text-center mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>CareLink AI Assistant - Powered by PUP CareLink</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
