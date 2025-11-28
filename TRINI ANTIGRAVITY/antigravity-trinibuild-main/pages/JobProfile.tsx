import React, { useState } from 'react';
import { Briefcase, User, FileText, Plus, X, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const JobProfile: React.FC = () => {
   const navigate = useNavigate();
   const [skills, setSkills] = useState<string[]>([]);
   const [newSkill, setNewSkill] = useState('');
   const [formData, setFormData] = useState({
      title: '',
      bio: '',
      experience: 'Entry Level'
   });

   const addSkill = () => {
      if (newSkill && !skills.includes(newSkill)) {
         setSkills([...skills, newSkill]);
         setNewSkill('');
      }
   };

   const handleSave = () => {
      const profile = {
         ...formData,
         skills,
         updatedAt: new Date().toISOString()
      };
      localStorage.setItem('job_profile', JSON.stringify(profile));

      alert("Profile Created! You can now 'Easy Apply' to jobs.");
      navigate('/jobs');
   };

   // Load existing profile on mount
   React.useEffect(() => {
      const saved = localStorage.getItem('job_profile');
      if (saved) {
         const p = JSON.parse(saved);
         setFormData({ title: p.title, bio: p.bio, experience: p.experience });
         setSkills(p.skills || []);
      }
   }, []);

   return (
      <div className="min-h-screen bg-gray-50 py-12">
         <div className="max-w-3xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
               <div className="bg-purple-700 p-8 text-white text-center">
                  <div className="bg-white/20 w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
                     JD
                  </div>
                  <h1 className="text-2xl font-bold">Create Professional Profile</h1>
                  <p className="text-purple-200">Let employers find you on TriniWorks</p>
               </div>

               <div className="p-8 space-y-8">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Professional Headline</label>
                     <div className="relative">
                        <Briefcase className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                           type="text"
                           placeholder="e.g. Experienced Graphic Designer or Sales Representative"
                           className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                           value={formData.title}
                           onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Bio / Summary</label>
                     <textarea
                        rows={4}
                        placeholder="Tell us about your experience..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Experience Level</label>
                        <select
                           className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                           value={formData.experience}
                           onChange={e => setFormData({ ...formData, experience: e.target.value })}
                        >
                           <option>Entry Level</option>
                           <option>Mid-Level (2-5 yrs)</option>
                           <option>Senior (5+ yrs)</option>
                           <option>Executive</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Resume / CV</label>
                        <div className="border border-gray-300 rounded-lg p-2 flex items-center justify-between bg-gray-50">
                           <span className="text-sm text-gray-500 ml-2">No file chosen</span>
                           <button className="bg-white border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-100">Upload</button>
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Skills</label>
                     <div className="flex gap-2 mb-3">
                        <input
                           type="text"
                           placeholder="Add a skill (e.g. Photoshop)"
                           className="flex-grow p-2 border border-gray-300 rounded-lg"
                           value={newSkill}
                           onChange={e => setNewSkill(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && addSkill()}
                        />
                        <button onClick={addSkill} className="bg-gray-900 text-white p-2 rounded-lg hover:bg-gray-700"><Plus /></button>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                           <span key={skill} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                              {skill} <button onClick={() => setSkills(skills.filter(s => s !== skill))} className="ml-2 hover:text-purple-900"><X className="h-3 w-3" /></button>
                           </span>
                        ))}
                     </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                     <Link to="/earn" className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</Link>
                     <button onClick={handleSave} className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-lg flex items-center">
                        <Check className="h-5 w-5 mr-2" /> Save Profile
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};