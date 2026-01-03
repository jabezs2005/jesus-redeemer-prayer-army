import { useState, useRef } from 'react';
import { Mic, Upload, FileText, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PrayerRequestForm() {
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    prayer_text: '',
  });
  const [voiceRecording, setVoiceRecording] = useState<Blob | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [document, setDocument] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadFile = async (file: File | Blob, bucket: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile_number) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: requestNumberData } = await supabase.rpc('generate_request_number');
      const requestNumber = requestNumberData as string;

      let voiceUrl = null;
      let imageUrl = null;
      let documentUrl = null;

      if (voiceRecording) {
        const voiceFileName = `${requestNumber}-${Date.now()}.webm`;
        voiceUrl = await uploadFile(voiceRecording, 'prayer-voice-recordings', voiceFileName);
      }

      if (image) {
        const imageFileName = `${requestNumber}-${Date.now()}-${image.name}`;
        imageUrl = await uploadFile(image, 'prayer-images', imageFileName);
      }

      if (document) {
        const docFileName = `${requestNumber}-${Date.now()}-${document.name}`;
        documentUrl = await uploadFile(document, 'prayer-documents', docFileName);
      }

      const { error } = await supabase.from('prayer_requests').insert({
        request_number: requestNumber,
        name: formData.name,
        mobile_number: formData.mobile_number,
        prayer_text: formData.prayer_text || null,
        voice_recording_url: voiceUrl,
        image_url: imageUrl,
        document_url: documentUrl,
      });

      if (error) throw error;

      setSubmitted(true);
      setFormData({ name: '', mobile_number: '', prayer_text: '' });
      setVoiceRecording(null);
      setImage(null);
      setDocument(null);
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      alert('Failed to submit prayer request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Prayer Request Submitted</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your Prayer Request Is Submitted. God will take care of it.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">JR</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Jesus Redeemer Prayer Army
            </h1>
            <p className="text-gray-600">Submit your prayer request</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prayer Request
              </label>
              <textarea
                value={formData.prayer_text}
                onChange={(e) => setFormData({ ...formData, prayer_text: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Type your prayer request here..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Voice Recording (Optional)
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    isRecording
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
                {voiceRecording && (
                  <button
                    type="button"
                    onClick={() => setVoiceRecording(null)}
                    className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {voiceRecording && (
                <p className="text-sm text-green-600 mt-2">Voice recording captured</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  <ImageIcon className="w-5 h-5" />
                  <span>{image ? image.name : 'Choose Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Document (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  <FileText className="w-5 h-5" />
                  <span>{document ? document.name : 'Choose Document'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setDocument(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {document && (
                  <button
                    type="button"
                    onClick={() => setDocument(null)}
                    className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Prayer Request'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="#admin"
              className="text-sm text-gray-600 hover:text-blue-600 underline transition-colors"
            >
              Admin Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
