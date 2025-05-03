import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Check, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Subject {
  id: string;
  name: string;
  image_url?: string;
}

const subjectImages = {
  'Mathematics': 'https://images.pexels.com/photos/3729557/pexels-photo-3729557.jpeg',
  'Physics': 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg',
  'Chemistry': 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg',
  'Biology': 'https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg',
  'English': 'https://images.pexels.com/photos/5088008/pexels-photo-5088008.jpeg',
  'History': 'https://images.pexels.com/photos/2928232/pexels-photo-2928232.jpeg',
};

export default function MySubjectsScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch subjects on mount using useEffect instead of useState
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all available subjects
      const { data: allSubjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) throw subjectsError;

      // Fetch user's selected subjects
      const { data: userSubjects, error: userSubjectsError } = await supabase
        .from('tutor_subjects')
        .select('subject_id')
        .eq('tutor_id', profile?.id);

      if (userSubjectsError) throw userSubjectsError;

      setSubjects(allSubjects);
      setSelectedSubjects(userSubjects.map(s => s.subject_id));
    } catch (err) {
      setError('Failed to load subjects. Please try again.');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      // Delete existing subjects
      const { error: deleteError } = await supabase
        .from('tutor_subjects')
        .delete()
        .eq('tutor_id', profile.id);

      if (deleteError) throw deleteError;

      // Insert new subjects
      if (selectedSubjects.length > 0) {
        const { error: insertError } = await supabase
          .from('tutor_subjects')
          .insert(
            selectedSubjects.map(subjectId => ({
              tutor_id: profile.id,
              subject_id: subjectId,
            }))
          );

        if (insertError) throw insertError;
      }

      router.back();
    } catch (err) {
      setError('Failed to save subjects. Please try again.');
      console.error('Error saving subjects:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>My Subjects</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.subjectsGrid}
        showsVerticalScrollIndicator={false}
      >
        {subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={[
              styles.subjectCard,
              selectedSubjects.includes(subject.id) && styles.subjectCardSelected
            ]}
            onPress={() => toggleSubject(subject.id)}
          >
            <Image
              source={{ uri: subjectImages[subject.name as keyof typeof subjectImages] }}
              style={styles.subjectImage}
            />
            <View style={styles.subjectOverlay} />
            <View style={styles.subjectContent}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              {selectedSubjects.includes(subject.id) && (
                <View style={styles.checkmark}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#DC2626',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  subjectCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  subjectCardSelected: {
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  subjectImage: {
    width: '100%',
    height: '100%',
  },
  subjectOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
  },
  subjectContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});