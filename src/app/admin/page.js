'use client';

import React, { useState, useEffect } from 'react';
import {
    Trash2, Eye, Users, FileText, Activity, Search, RefreshCw,
    LayoutDashboard, UserRound, Stethoscope, GraduationCap,
    UtensilsCrossed, ShieldCheck, ClipboardList, MapPin, Navigation,
    School, CheckCircle2, Mail, Phone, Map, Building2, User, Loader2, Lock,
    Upload, Calendar, Hash, Droplet, FilePlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './admin.css';
import { statesData } from '../../utils/statesData';

import { useRouter } from 'next/navigation';
import { validatePhone, validateEmail, validateFullName } from '../../utils/validation';
import { NotificationProvider, useNotification } from '../../context/NotificationContext';

export default function AdminDashboard() {
    return (
        <AdminDashboardContent />
    );
}

function AdminDashboardContent() {
    const { showAlert } = useNotification();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [authenticated, setAuthenticated] = useState(false);
    const [dataType, setDataType] = useState('records'); // 'records' or 'cards' (for dashboard view)
    const [records, setRecords] = useState([]);
    const [cards, setCards] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [healthAssistants, setHealthAssistants] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [studentFilters, setStudentFilters] = useState({
        search: '',
        school: '',
        class: '',
        address: ''
    });

    const stateData = {
        "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
        "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
        "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
        "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
        "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
        "Goa": ["North Goa", "South Goa"],
        "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
        "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
        "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
        "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Saraikela Kharsawan", "Simdega", "West Singhbhum"],
        "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
        "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
        "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Narmadapuram", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
        "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
        "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
        "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
        "Mizoram": ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"],
        "Nagaland": ["Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
        "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
        "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Sri Muktsar Sahib", "Tarn Taran"],
        "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
        "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
        "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
        "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
        "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
        "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
        "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
        "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
        "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
        "Chandigarh": ["Chandigarh"],
        "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
        "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
        "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
        "Ladakh": ["Kargil", "Leh"],
        "Lakshadweep": ["Lakshadweep"],
        "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
    };

    // Principal Onboarding State
    const [isFetchingPincode, setIsFetchingPincode] = useState(false);
    const [campusForm, setCampusForm] = useState({
        state: '', district: '', schoolName: '', schoolCode: '', officialEmail: '', phoneNumber: '',
        city: '', area: '', addressLine: '', pincode: '',
        principalName: '', principalPhone: '', principalEmail: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // HealthAssistant Onboarding State
    const [healthAssistantForm, setHealthAssistantForm] = useState({
        fullName: '', email: '', phone: '', state: '', district: '', assignedCampus: '', idNumber: '', password: ''
    });
    const [isHealthAssistantSubmitting, setIsHealthAssistantSubmitting] = useState(false);

    // Health Card Form State
    const [healthCardForm, setHealthCardForm] = useState({
        photoBase64: '', lFileNo: '', dateOfIssue: '', validity: '', name: '', dob: '', age: '',
        bloodGroup: '', studentClass: '', rollNo: '', school: '', address: ''
    });
    const [isHealthCardSubmitting, setIsHealthCardSubmitting] = useState(false);

    const handleAreaBlur = async () => {
        if (!campusForm.area) return;
        setIsFetchingPincode(true);
        try {
            const response = await fetch(`https://api.postalpincode.in/postoffice/${campusForm.area}`);
            const data = await response.json();
            if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
                setCampusForm(prev => ({ ...prev, pincode: data[0].PostOffice[0].Pincode }));
            }
        } catch (error) {
            console.error("Error fetching pincode:", error);
        } finally {
            setIsFetchingPincode(false);
        }
    };

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'principal', label: 'Principal', icon: GraduationCap },
        { id: 'healthAssistant', label: 'HealthAssistant', icon: Stethoscope },
        { id: 'student', label: 'Student', icon: UserRound },
        { id: 'healthcard', label: 'Health Card', icon: ClipboardList },
        { id: 'food', label: 'Food', icon: UtensilsCrossed },
        { id: 'prevention', label: 'Health-Prevention', icon: ShieldCheck },
    ];

    useEffect(() => {
        const isAuth = localStorage.getItem('isAdminAuthenticated');
        if (!isAuth) {
            router.push('/admin/login');
        } else {
            setAuthenticated(true);
            fetchData();
        }
    }, [router]);

    // Re-fetch data whenever tab changes or when window gets focus
    useEffect(() => {
        if (authenticated) {
            fetchData();
        }
    }, [activeTab]);

    // Setup polling every 30 seconds and refresh on focus
    useEffect(() => {
        if (!authenticated) return;
        
        const handleFocus = () => fetchData();
        window.addEventListener('focus', handleFocus);

        const interval = setInterval(() => {
            fetchData();
        }, 30000); // 30 seconds

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [authenticated]);

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuthenticated');
        router.push('/admin/login');
    };

    const fetchData = async () => {
        if (!localStorage.getItem('isAdminAuthenticated')) return;
        setLoading(true);
        try {
            const [recordsRes, cardsRes, campusesRes, healthAssistantsRes, studentsRes] = await Promise.all([
                fetch('/api/health-records', { cache: 'no-store' }),
                fetch('/api/health-cards', { cache: 'no-store' }),
                fetch('/api/campuses', { cache: 'no-store' }),
                fetch('/api/health-assistants', { cache: 'no-store' }),
                fetch('/api/students', { cache: 'no-store' })
            ]);
            const recordsData = await recordsRes.json();
            const cardsData = await cardsRes.json();
            const campusesData = await campusesRes.json();
            const healthAssistantsData = await healthAssistantsRes.json();
            const studentsData = await studentsRes.json();

            setRecords(Array.isArray(recordsData) ? recordsData : []);
            setCards(Array.isArray(cardsData) ? cardsData : []);
            setCampuses(Array.isArray(campusesData) ? campusesData : []);
            setHealthAssistants(Array.isArray(healthAssistantsData) ? healthAssistantsData : []);
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, type) => {
        if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

        try {
            let endpoint = '';
            if (type === 'records') endpoint = '/api/health-records';
            else if (type === 'cards') endpoint = '/api/health-cards';
            else if (type === 'students') endpoint = '/api/students';

            const res = await fetch(`${endpoint}?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                if (type === 'records') setRecords(records.filter(r => r._id !== id));
                else if (type === 'cards') setCards(cards.filter(c => c._id !== id));
                else if (type === 'students') setStudents(students.filter(s => s._id !== id));
            } else {
                alert('Failed to delete record');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('An error occurred while deleting');
        }
    };

    const handleCampusSubmit = async (e) => {
        e.preventDefault();
        if (!validateFullName(campusForm.principalName)) { alert('Invalid Principal Name. Must be at least 4 characters.'); return; }
        if (!validateEmail(campusForm.principalEmail)) { alert('Invalid principal email format. Please check the rules.'); return; }
        if (!validatePhone(campusForm.principalPhone)) { alert('Invalid principal phone number. Must be 10 digits starting with 6, 7, 8, or 9.'); return; }
        setIsSubmitting(true);
        try {
            const payload = {
                state: campusForm.state,
                district: campusForm.district,
                schoolName: campusForm.schoolName,
                schoolCode: campusForm.schoolCode,
                officialEmail: campusForm.officialEmail,
                phoneNumber: campusForm.phoneNumber,
                address: {
                    city: campusForm.city,
                    area: campusForm.area,
                    addressLine: campusForm.addressLine,
                    pincode: campusForm.pincode
                },
                principal: {
                    name: campusForm.principalName,
                    phone: campusForm.principalPhone,
                    email: campusForm.principalEmail
                }
            };

            const res = await fetch('/api/campuses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('✅ Campus onboarded successfully!');
                setCampusForm({
                    state: '', district: '', schoolName: '', schoolCode: '', officialEmail: '', phoneNumber: '',
                    city: '', area: '', addressLine: '', pincode: '',
                    principalName: '', principalPhone: '', principalEmail: ''
                });
                fetchData();
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            alert('An error occurred during onboarding');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHealthAssistantSubmit = async (e) => {
        e.preventDefault();

        // Standardized Validations
        if (!validateFullName(healthAssistantForm.fullName)) {
            showAlert("Full Name must be at least 4 characters.", 'warning', 'Invalid Name');
            return;
        }

        if (healthAssistantForm.email && !validateEmail(healthAssistantForm.email)) {
            showAlert('Please use a valid email address.', 'warning', 'Invalid Email');
            return;
        }

        if (!validatePhone(healthAssistantForm.phone)) {
            showAlert('Phone number must be 10 digits starting with 6, 7, 8, or 9.', 'warning', 'Invalid Phone');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
        if (!passwordRegex.test(healthAssistantForm.password)) {
            showAlert('Password must be at least 6 characters, contain one uppercase letter, one number, and one special character.', 'warning', 'Weak Password');
            return;
        }

        const cleanPhone = healthAssistantForm.phone.replace(/^\+91/, '').replace(/\s+/g, '');
        setIsHealthAssistantSubmitting(true);
        try {
            const payload = { ...healthAssistantForm, phone: cleanPhone };
            const res = await fetch('/api/health-assistants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('✅ HealthAssistant registered successfully!');
                setHealthAssistantForm({
                    fullName: '', email: '', phone: '', state: '', district: '', assignedCampus: '', idNumber: '', password: ''
                });
                fetchData();
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('HealthAssistant registration error:', error);
            alert('An error occurred during registration');
        } finally {
            setIsHealthAssistantSubmitting(false);
        }
    };

    const handleHealthCardSubmit = async (e) => {
        e.preventDefault();
        setIsHealthCardSubmitting(true);
        try {
            const res = await fetch('/api/health-cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(healthCardForm)
            });

            if (res.ok) {
                alert('✅ Health Card added successfully!');
                setHealthCardForm({
                    photoBase64: '', lFileNo: '', dateOfIssue: '', validity: '', name: '', dob: '', age: '',
                    bloodGroup: '', studentClass: '', rollNo: '', school: '', address: ''
                });
                fetchData();
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Health Card registration error:', error);
            alert('An error occurred while saving the health card data.');
        } finally {
            setIsHealthCardSubmitting(false);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setHealthCardForm({ ...healthCardForm, photoBase64: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const renderDashboard = () => {
        const currentData = dataType === 'records' ? records : cards;
        const filteredData = currentData.filter(item =>
            (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.school?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.schoolEnvelope?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.studentClass?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.class?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-view">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Health Records</h3>
                        <div className="value">{records.length}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Total Health Cards</h3>
                        <div className="value">{cards.length}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Total Active Users</h3>
                        <div className="value">{new Set([...records.map(r => r.name), ...cards.map(c => c.name)]).size}</div>
                    </div>
                </div>

                <div className="admin-header" style={{ marginBottom: '1.5rem', background: 'none' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={`admin-input ${dataType === 'records' ? 'active' : ''}`}
                            style={{ cursor: 'pointer', background: dataType === 'records' ? '#3154c4' : 'white', color: dataType === 'records' ? 'white' : 'inherit' }}
                            onClick={() => setDataType('records')}
                        >
                            Health Records
                        </button>
                        <button
                            className={`admin-input ${dataType === 'cards' ? 'active' : ''}`}
                            style={{ cursor: 'pointer', background: dataType === 'cards' ? '#3154c4' : 'white', color: dataType === 'cards' ? 'white' : 'inherit' }}
                            onClick={() => setDataType('cards')}
                        >
                            Health Cards
                        </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)', width: '16px' }} />
                        <input
                            type="text"
                            placeholder="Search data..."
                            className="admin-input"
                            style={{ paddingLeft: '2.5rem', width: '250px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="records-table-container">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                            </div>
                        ) : filteredData.length > 0 ? (
                            <table className="records-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>{dataType === 'records' ? 'Class' : 'ID'}</th>
                                        <th>Status/Details</th>
                                        <th>School</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item._id}>
                                            <td style={{ fontWeight: '600' }}>{item.name}</td>
                                            <td>{dataType === 'records' ? (item.studentClass || item.class) : (item.idNo || item.rollNo)}</td>
                                            <td>{item.age} • {item.gender || item.bloodGroup}</td>
                                            <td>{item.school || item.schoolEnvelope}</td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="action-btn view-btn"><Eye size={16} /></button>
                                                <button className="action-btn delete-btn" onClick={() => handleDelete(item._id, dataType)}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                No results found.
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        );
    };

    const renderPrincipal = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-onboarding-container">
            <div className="onboarding-header">
                <h1>Onboard New Campus</h1>
                <p>Expand your hospital network by registering a new school branch.</p>
            </div>

            <form onSubmit={handleCampusSubmit} className="premium-form-card">
                <div className="form-top-row">
                    <div className="select-group">
                        <div className="select-wrapper">
                            <MapPin className="select-icon" size={18} />
                            <select
                                className="admin-input"
                                value={campusForm.state}
                                onChange={(e) => setCampusForm({ ...campusForm, state: e.target.value, district: '' })}
                                required
                            >
                                <option value="">Select State</option>
                                {Object.keys(statesData).sort().map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="select-group">
                        <div className="select-wrapper">
                            <Navigation className="select-icon" size={18} />
                            <select
                                className="admin-input"
                                value={campusForm.district}
                                onChange={(e) => setCampusForm({ ...campusForm, district: e.target.value })}
                                required
                                disabled={!campusForm.state}
                            >
                                <option value="">Select District</option>
                                {campusForm.state && statesData[campusForm.state]?.sort().map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section-container">
                    <div className="section-title-with-icon">
                        <div className="title-icon">🏫</div>
                        <div>
                            <h3>Campus Details</h3>
                            <p>Entering details for {campusForm.schoolName || '...'}</p>
                        </div>
                    </div>

                    <div className="form-main-grid">
                        <div className="form-inputs-area">
                            <div className="input-field full-width">
                                <label>SCHOOL NAME *</label>
                                <div className="input-with-icon">
                                    <School className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. St. Xavier's High"
                                        value={campusForm.schoolName}
                                        onChange={(e) => setCampusForm({ ...campusForm, schoolName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="input-field">
                                    <label>SCHOOL CODE</label>
                                    <div className="input-with-icon">
                                        <Activity className="icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. SCH-001"
                                            value={campusForm.schoolCode}
                                            onChange={(e) => setCampusForm({ ...campusForm, schoolCode: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="input-field">
                                    <label>OFFICIAL EMAIL</label>
                                    <div className="input-with-icon">
                                        <Mail className="icon" size={18} />
                                        <input
                                            type="email"
                                            placeholder="contact@school.edu"
                                            value={campusForm.officialEmail}
                                            onChange={(e) => setCampusForm({ ...campusForm, officialEmail: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-field">
                                <label>PHONE NUMBER</label>
                                <div className="input-with-icon">
                                    <Phone className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="+91 98765 43210"
                                        value={campusForm.phoneNumber}
                                        onChange={(e) => setCampusForm({ ...campusForm, phoneNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sub-section">
                        <div className="sub-title">🗺️ ADDRESS DETAILS</div>
                        <div className="input-row">
                            <div className="input-field">
                                <label>CITY *</label>
                                <input
                                    type="text"
                                    placeholder="City Name"
                                    value={campusForm.city}
                                    onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-field">
                                <label>AREA / LOCALITY</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Indiranagar"
                                    value={campusForm.area}
                                    onChange={(e) => setCampusForm({ ...campusForm, area: e.target.value })}
                                    onBlur={handleAreaBlur}
                                />
                            </div>
                        </div>
                        <div className="input-field full-width">
                            <label>ADDRESS LINE</label>
                            <input
                                type="text"
                                placeholder="Street, Building"
                                value={campusForm.addressLine}
                                onChange={(e) => setCampusForm({ ...campusForm, addressLine: e.target.value })}
                            />
                        </div>
                        <div className="input-field">
                            <label>PINCODE</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder={isFetchingPincode ? "Fetching..." : "560000"}
                                    value={campusForm.pincode}
                                    onChange={(e) => setCampusForm({ ...campusForm, pincode: e.target.value })}
                                    style={isFetchingPincode ? { opacity: 0.6 } : {}}
                                />
                                {isFetchingPincode && <Loader2 className="animate-spin" style={{ position: 'absolute', right: '10px', top: '10px', color: '#6366f1' }} size={16} />}
                            </div>
                        </div>
                    </div>

                    <div className="sub-section principal-credentials-bg">
                        <div className="sub-title">👤 PRINCIPAL CREDENTIALS</div>
                        <div className="input-row">
                            <div className="input-field">
                                <label>PRINCIPAL NAME</label>
                                <div className={`input-with-icon ${campusForm.principalName && campusForm.principalName.length < 4 ? 'input-invalid' : ''}`}>
                                    <User className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={campusForm.principalName}
                                        onChange={(e) => setCampusForm({ ...campusForm, principalName: e.target.value })}
                                    />
                                </div>
                                {campusForm.principalName && campusForm.principalName.length < 4 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>invalid (Min 4 chars)</span>}
                            </div>
                            <div className="input-field">
                                <label>PRINCIPAL PHONE *</label>
                                <div className="input-with-icon">
                                    <Phone className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Mobile Number"
                                        value={campusForm.principalPhone}
                                        onChange={(e) => setCampusForm({ ...campusForm, principalPhone: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="input-field full-width">
                            <label>PRINCIPAL EMAIL</label>
                            <div className="input-with-icon">
                                <Mail className="icon" size={18} />
                                <input
                                    type="email"
                                    placeholder="principal@school.edu"
                                    value={campusForm.principalEmail}
                                    onChange={(e) => setCampusForm({ ...campusForm, principalEmail: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="btn-initialize" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Initialize Campus
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <div style={{ marginTop: '3rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--admin-text-primary)' }}>Registered Campuses & Principals</h3>
                <div className="table-responsive" style={{ background: 'white', borderRadius: '1rem', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--admin-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>School Name</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Principal Name</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Location</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campuses.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No campuses registered yet.</td></tr>
                            ) : (
                                campuses.map((campus, idx) => (
                                    <tr key={campus._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{campus.schoolName} <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>{campus.schoolCode}</span></td>
                                        <td style={{ padding: '1rem' }}>{campus.principal?.name || 'N/A'}</td>
                                        <td style={{ padding: '1rem' }}>{campus.address?.city || campus.district}, {campus.state}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{campus.phoneNumber}<br /><span style={{ color: '#64748b' }}>{campus.officialEmail}</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );

    const renderHealthAssistant = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-onboarding-container">
            <div className="onboarding-header" style={{ marginBottom: '1rem' }}>
                <h1>Register New Health Assistant</h1>
                <p>Register a healthcare professional to complete your campus staff.</p>
            </div>

            <form onSubmit={handleHealthAssistantSubmit} className="premium-form-card">
                <div className="form-top-row">
                    <div className="select-group">
                        <div className="select-wrapper">
                            <MapPin className="select-icon" size={18} />
                            <select
                                className="admin-input"
                                value={healthAssistantForm.state}
                                onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, state: e.target.value, district: '' })}
                                required
                            >
                                <option value="">Select State</option>
                                {Object.keys(statesData).sort().map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="select-group">
                        <div className="select-wrapper">
                            <Navigation className="select-icon" size={18} />
                            <select
                                className="admin-input"
                                value={healthAssistantForm.district}
                                onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, district: e.target.value })}
                                required
                                disabled={!healthAssistantForm.state}
                            >
                                <option value="">Select District</option>
                                {healthAssistantForm.state && statesData[healthAssistantForm.state]?.sort().map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section-container">
                    <div className="section-title-with-icon">
                        <div className="title-icon">👩‍⚕️</div>
                        <div>
                            <h3>Professional Details</h3>
                            <p>Entering details for {healthAssistantForm.fullName || '...'}</p>
                        </div>
                    </div>

                    <div className="form-main-grid">
                        <div className="form-inputs-area">
                            <div className="input-field">
                                <label>HEALTH ASSISTANT FULL NAME *</label>
                                <div className={`input-with-icon ${healthAssistantForm.fullName && healthAssistantForm.fullName.length < 4 ? 'input-invalid' : ''}`}>
                                    <User className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={healthAssistantForm.fullName}
                                        onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                {healthAssistantForm.fullName && healthAssistantForm.fullName.length < 4 && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>invalid (Min 4 chars)</span>}
                            </div>

                            <div className="input-row">
                                <div className="input-field">
                                    <label>EMAIL ADDRESS</label>
                                    <div className="input-with-icon">
                                        <Mail className="icon" size={18} />
                                        <input
                                            type="email"
                                            placeholder="jane.doe@example.com"
                                            value={healthAssistantForm.email}
                                            onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-field">
                                    <label>PHONE NUMBER *</label>
                                    <div className="input-with-icon">
                                        <Phone className="icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="+91 98765 43210"
                                            value={healthAssistantForm.phone}
                                            onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="input-field">
                                    <label>ASSIGNED CAMPUS CODE *</label>
                                    <div className="input-with-icon">
                                        <Building2 className="icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. SCH-001"
                                            value={healthAssistantForm.assignedCampus}
                                            onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, assignedCampus: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-field">
                                    <label>ID NUMBER *</label>
                                    <div className="input-with-icon">
                                        <FileText className="icon" size={18} />
                                        <input
                                            type="text"
                                            placeholder="e.g. ID-123456"
                                            value={healthAssistantForm.idNumber}
                                            onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, idNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sub-section">
                        <div className="sub-title">🔐 LOGIN CREDENTIALS</div>
                        <div className="input-field full-width">
                            <label>TEMPORARY PASSWORD *</label>
                            <div className="input-with-icon">
                                <Lock className="icon" size={18} />
                                <input
                                    type="password"
                                    placeholder="Enter a secure password for the health assistant"
                                    value={healthAssistantForm.password}
                                    onChange={(e) => setHealthAssistantForm({ ...healthAssistantForm, password: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="btn-initialize" disabled={isHealthAssistantSubmitting}>
                            {isHealthAssistantSubmitting ? 'Processing...' : (
                                <>
                                    <CheckCircle2 size={20} />
                                    Register Health Assistant
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <div style={{ marginTop: '3rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--admin-text-primary)' }}>Registered Health Assistants</h3>
                <div className="table-responsive" style={{ background: 'white', borderRadius: '1rem', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--admin-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Health Assistant Name</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Assigned Campus</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>ID No.</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Location</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {healthAssistants.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No healthAssistants registered yet.</td></tr>
                            ) : (
                                healthAssistants.map((healthAssistant, idx) => (
                                    <tr key={healthAssistant._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{healthAssistant.fullName}</td>
                                        <td style={{ padding: '1rem' }}>{healthAssistant.assignedCampus}</td>
                                        <td style={{ padding: '1rem' }}>{healthAssistant.idNumber}</td>
                                        <td style={{ padding: '1rem' }}>{healthAssistant.district}, {healthAssistant.state}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{healthAssistant.email}<br /><span style={{ color: '#64748b' }}>{healthAssistant.phone}</span></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div >
    );

    const renderHealthCard = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-onboarding-container">
            <div className="onboarding-header" style={{ marginBottom: '1rem' }}>
                <h1>Add Health Card</h1>
                <p>Manually enter medical identity card details.</p>
            </div>

            <form onSubmit={handleHealthCardSubmit} className="premium-form-card">

                {/* Top Section: Photo & Primary Info */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>

                    {/* Photo Upload Box */}
                    <div style={{ flexShrink: 0 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--admin-text-secondary)' }}>
                            PROFILE PICTURE
                        </label>
                        <div style={{ width: '150px', height: '180px', border: '2px dashed var(--admin-border)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => document.getElementById('photo-upload').click()}>
                            {healthCardForm.photoBase64 ? (
                                <img src={healthCardForm.photoBase64} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                    <Upload size={32} style={{ margin: '0 auto 0.5rem' }} />
                                    <span style={{ fontSize: '0.875rem' }}>Upload Photo</span>
                                </div>
                            )}
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handlePhotoUpload}
                            />
                        </div>
                    </div>

                    {/* Right side info fields */}
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                        <div className="input-field">
                            <label>FILE NO:</label>
                            <div className="input-with-icon">
                                <FileText className="icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Enter File No."
                                    value={healthCardForm.lFileNo}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, lFileNo: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-field">
                            <label>DATE OF ISSUE:</label>
                            <div className="input-with-icon">
                                <Calendar className="icon" size={18} />
                                <input
                                    type="date"
                                    value={healthCardForm.dateOfIssue}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, dateOfIssue: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-field">
                            <label>VALIDITY:</label>
                            <div className="input-with-icon">
                                <CheckCircle2 className="icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. 1 Year"
                                    value={healthCardForm.validity}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, validity: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Personal Details */}
                <div className="form-main-grid">
                    <div className="form-inputs-area">
                        <div className="input-field full-width" style={{ marginBottom: '1rem' }}>
                            <label>NAME:</label>
                            <div className="input-with-icon">
                                <User className="icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Student's Full Name"
                                    value={healthCardForm.name}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-field">
                                <label>DOB (Or Age):</label>
                                <div className="input-with-icon">
                                    <Calendar className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="DOB / Age"
                                        value={healthCardForm.dob || healthCardForm.age}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setHealthCardForm({ ...healthCardForm, dob: val, age: val });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="input-field">
                                <label>BLOOD GROUP:</label>
                                <div className="input-with-icon">
                                    <Droplet className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. O+"
                                        value={healthCardForm.bloodGroup}
                                        onChange={(e) => setHealthCardForm({ ...healthCardForm, bloodGroup: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-row" style={{ marginBottom: '1rem' }}>
                            <div className="input-field">
                                <label>CLASS:</label>
                                <div className="input-with-icon">
                                    <Hash className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="e.g. 10th Standard"
                                        value={healthCardForm.studentClass}
                                        onChange={(e) => setHealthCardForm({ ...healthCardForm, studentClass: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="input-field">
                                <label>ROLL NO:</label>
                                <div className="input-with-icon">
                                    <Hash className="icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Roll Number"
                                        value={healthCardForm.rollNo}
                                        onChange={(e) => setHealthCardForm({ ...healthCardForm, rollNo: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="input-field full-width" style={{ marginBottom: '1rem' }}>
                            <label>SCHL (School Name):</label>
                            <div className="input-with-icon">
                                <School className="icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="School Name"
                                    value={healthCardForm.school}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, school: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="input-field full-width">
                            <label>ADDRESS:</label>
                            <div className="input-with-icon">
                                <MapPin className="icon" size={18} />
                                <input
                                    type="text"
                                    placeholder="Full Address"
                                    value={healthCardForm.address}
                                    onChange={(e) => setHealthCardForm({ ...healthCardForm, address: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-footer" style={{ marginTop: '2rem' }}>
                    <button type="submit" className="btn-initialize" disabled={isHealthCardSubmitting}>
                        {isHealthCardSubmitting ? 'Processing...' : (
                            <>
                                <FilePlus size={20} />
                                Save Health Card
                            </>
                        )}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '3rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--admin-text-primary)' }}>Saved Health Cards</h3>
                <div className="table-responsive" style={{ background: 'white', borderRadius: '1rem', border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--admin-border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Student Name</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>File No / Validity</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>Class & Roll</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>School Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cards.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No health cards saved yet.</td></tr>
                            ) : (
                                cards.map((card, idx) => (
                                    <tr key={card._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {card.photoBase64 ? (
                                                <img src={card.photoBase64} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={20} color="#94a3b8" />
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{card.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Blood: {card.bloodGroup || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{card.lFileNo || 'N/A'} <br /><span style={{ fontSize: '0.75rem', color: '#64748b' }}>{card.validity || 'N/A'}</span></td>
                                        <td style={{ padding: '1rem' }}>{card.studentClass || 'N/A'} <br /><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Roll: {card.rollNo || 'N/A'}</span></td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{card.school}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );

    const renderStudent = () => {
        const uniqueSchools = [...new Set(campuses.map(c => c.schoolName))].filter(Boolean).sort();
        const uniqueClasses = [...new Set(students.map(s => s.className))].filter(Boolean).sort();
        const uniqueAddresses = [...new Set(students.map(s => s.address))].filter(Boolean).sort();

        // Check if any filter is active
        const isFiltered = studentFilters.search || studentFilters.school || studentFilters.class || studentFilters.address;

        const filteredStudents = isFiltered ? students.filter(s => {
            const matchSearch = !studentFilters.search || 
                (s.studentName?.toLowerCase().includes(studentFilters.search.toLowerCase()) || 
                 s.rollNo?.toLowerCase().includes(studentFilters.search.toLowerCase()));
            const matchSchool = !studentFilters.school || s.school === studentFilters.school;
            const matchClass = !studentFilters.class || s.className === studentFilters.class;
            const matchAddress = !studentFilters.address || s.address === studentFilters.address;
            return matchSearch && matchSchool && matchClass && matchAddress;
        }) : [];

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="student-view">
                {/* Filters Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--admin-border)', gap: '0.75rem' }}>
                    
                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-secondary)', width: '16px' }} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="admin-input"
                            style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.85rem' }}
                            value={studentFilters.search}
                            onChange={(e) => setStudentFilters({ ...studentFilters, search: e.target.value })}
                        />
                    </div>

                    {/* School Dropdown */}
                    <select 
                        className="admin-input" 
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        value={studentFilters.school} 
                        onChange={(e) => setStudentFilters({ ...studentFilters, school: e.target.value })}
                    >
                        <option value="">All Schools</option>
                        {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Class Dropdown */}
                    <select 
                        className="admin-input" 
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        value={studentFilters.class} 
                        onChange={(e) => setStudentFilters({ ...studentFilters, class: e.target.value })}
                    >
                        <option value="">All Classes</option>
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Address Dropdown */}
                    <select 
                        className="admin-input" 
                        style={{ width: '100%', fontSize: '0.85rem' }}
                        value={studentFilters.address} 
                        onChange={(e) => setStudentFilters({ ...studentFilters, address: e.target.value })}
                    >
                        <option value="">All Addresses</option>
                        {uniqueAddresses.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    <button 
                        className="admin-input" 
                        style={{ cursor: 'pointer', background: '#f1f5f9', fontWeight: '600', color: '#64748b', border: 'none', height: '100%', fontSize: '0.85rem' }}
                        onClick={() => setStudentFilters({ search: '', school: '', class: '', address: '' })}
                    >
                        Clear Filters
                    </button>
                </div>

                <div className="records-table-container">
                    {!isFiltered ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                            <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <h3>Please apply filters to view student data</h3>
                            <p>Select a school, class, or search for a student to see the list.</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <table className="records-table">
                            <thead>
                                <tr>
                                    <th>Roll No</th>
                                    <th>Student Name</th>
                                    <th>Class</th>
                                    <th>School</th>
                                    <th>Address</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((s) => (
                                    <tr key={s._id}>
                                        <td>{s.rollNo}</td>
                                        <td style={{ fontWeight: '600' }}>{s.studentName}</td>
                                        <td>{s.className}</td>
                                        <td>{s.school}</td>
                                        <td>{s.address}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="action-btn view-btn"><Eye size={16} /></button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete(s._id, 'students')}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                            No students found matching your filters.
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderPlaceholder = (title) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="placeholder-view">
            <div style={{ background: 'rgba(49, 84, 196, 0.05)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                {React.createElement(sidebarItems.find(i => i.id === activeTab).icon, { size: 48, color: '#3154c4' })}
            </div>
            <h2>{title} View</h2>
            <p>This module is currently being synchronized with the main system data.</p>
        </motion.div>
    );

    if (!authenticated) return null;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    Children Health <span style={{ color: 'var(--admin-sidebar-active)' }}>Admin</span>
                </div>
                <nav className="sidebar-nav">
                    {sidebarItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div style={{ padding: '1rem' }}>
                    <button
                        onClick={handleLogout}
                        className="nav-item"
                        style={{
                            width: '100%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ff8080',
                            border: 'none',
                            marginTop: 'auto'
                        }}
                    >
                        <Trash2 size={18} />
                        <span>Logout</span>
                    </button>
                </div>
                <div style={{ padding: '1rem 2rem', fontSize: '0.75rem', opacity: 0.5 }}>
                    © 2026 Vajra Admin v2.0
                </div>
            </aside>

            <main className="admin-main" style={['principal', 'healthAssistant', 'student', 'healthcard'].includes(activeTab) ? { paddingTop: '1rem' } : {}}>
                {!['principal', 'healthAssistant', 'student', 'healthcard'].includes(activeTab) && (
                    <header className="admin-header">
                        <div>
                            <h1>{sidebarItems.find(i => i.id === activeTab).label}</h1>
                            <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>School Health Intelligence System</p>
                        </div>
                        <button className="action-btn view-btn" onClick={fetchData} title="Refresh Data">
                            <RefreshCw size={18} />
                        </button>
                    </header>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'principal' && renderPrincipal()}
                    {activeTab === 'healthAssistant' && renderHealthAssistant()}
                    {activeTab === 'student' && renderStudent()}
                    {activeTab === 'healthcard' && renderHealthCard()}
                    {['food', 'prevention'].includes(activeTab) && renderPlaceholder(sidebarItems.find(i => i.id === activeTab).label)}
                </AnimatePresence>
            </main>
        </div>
    );
}
