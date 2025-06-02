import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import Checkbox from 'expo-checkbox';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface Subject {
  id: string;
  name: string;
}

export default function ManageTutorSubjectsScreen() {
  const { profile } = useAuth();
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState<Set<string>>(new Set()); // To track initial state for changes
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'User profile not found.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      // Fetch all available subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name', { ascending: true });
      if (subjectsError) throw subjectsError;
      setAllSubjects(subjectsData || []);

      // Fetch tutor's current subjects
      const { data: tutorSubjectsData, error: tutorSubjectsError } = await supabase
        .from('tutor_subjects')
        .select('subject_id')
        .eq('tutor_id', profile.id);
      if (tutorSubjectsError) throw tutorSubjectsError;
      
      const currentIds = new Set(tutorSubjectsData?.map(ts => ts.subject_id) || []);
      setSelectedSubjectIds(currentIds);
      setInitialSelectedIds(new Set(currentIds)); // Store initial state

    } catch (error: any) {
      console.error('Error fetching subjects data:', error);
      Alert.alert('Error', `Failed to load subjects: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(subjectId)) {
        newSelectedIds.delete(subjectId);
      } else {
        newSelectedIds.add(subjectId);
      }
      return newSelectedIds;
    });
  };

  const handleSaveChanges = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'User profile not found.');
      return;
    }
    setIsSaving(true);
    try {
      // Determine subjects to add and remove
      const subjectsToAdd = Array.from(selectedSubjectIds).filter(id => !initialSelectedIds.has(id));
      const subjectsToRemove = Array.from(initialSelectedIds).filter(id => !selectedSubjectIds.has(id));

      // Remove subjects
      if (subjectsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('tutor_subjects')
          .delete()
          .eq('tutor_id', profile.id)
          .in('subject_id', subjectsToRemove);
        if (deleteError) throw deleteError;
      }

      // Add subjects
      if (subjectsToAdd.length > 0) {
        const insertData = subjectsToAdd.map(subject_id => ({
          tutor_id: profile.id,
          subject_id,
        }));
        const { error: insertError } = await supabase
          .from('tutor_subjects')
          .insert(insertData);
        if (insertError) throw insertError;
      }
      
      setInitialSelectedIds(new Set(selectedSubjectIds)); // Update initial state to current
      Alert.alert('Success', 'Your subjects have been updated.');
      // Optionally, navigate back or refresh data
      // router.back(); 
    } catch (error: any) {
      console.error('Error saving subjects:', error);
      Alert.alert('Error', `Failed to save subjects: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasChanges = () => {
    if (selectedSubjectIds.size !== initialSelectedIds.size) return true;
    for (const id of selectedSubjectIds) {
      if (!initialSelectedIds.has(id)) return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/tutor-dashboard')}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage My Teaching Subjects</Text>
      </View>

      <FlatList
        data={allSubjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleToggleSubject(item.id)} style={styles.subjectItem}>
            <Checkbox
              style={styles.checkbox}
              value={selectedSubjectIds.has(item.id)}
              onValueChange={() => handleToggleSubject(item.id)}
              color={selectedSubjectIds.has(item.id) ? '#4F46E5' : undefined}
            />
            <Text style={styles.subjectName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No subjects available to select.</Text>
            <Text style={styles.emptySubText}>Please contact support if you think this is an error.</Text>
          </View>
        }
        contentContainerStyle={styles.listContentContainer}
      />

      {hasChanges() && (
        <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSaveChanges} 
            disabled={isSaving}
        >
            {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
            <Save size={20} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginLeft: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContentContainer: {
    paddingVertical: 16,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    marginRight: 16,
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  subjectName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#1F2937',
    flex: 1, // Allow text to wrap
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5B4FC', // Lighter shade when disabled
  },
  saveButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
