import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, FlatList } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// Define the type for a course
type Course = {
  id: string;
  tutor_id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  created_at: string;
};

export default function ManageCoursesScreen() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false); // State to toggle add form
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseSubject, setNewCourseSubject] = useState('');
  const [newCoursePrice, setNewCoursePrice] = useState('');

  // Fetch courses for the tutor
  useEffect(() => {
    const fetchCourses = async () => {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('courses') // Assuming a 'courses' table exists
          .select('*')
          .eq('tutor_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);
      } catch (error) {
        console.error('Error fetching courses:', error);
        Alert.alert('Error', 'Failed to fetch your courses.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [profile]);

  // Handle adding a new course
  const handleAddCourse = async () => {
    if (!profile?.id || !newCourseTitle || !newCourseSubject || !newCoursePrice) {
      Alert.alert('Error', 'Please fill in Title, Subject, and Price.');
      return;
    }

    const priceNumber = parseFloat(newCoursePrice);
    if (isNaN(priceNumber) || priceNumber < 0) {
        Alert.alert('Error', 'Please enter a valid positive price.');
        return;
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          tutor_id: profile.id,
          title: newCourseTitle,
          description: newCourseDescription,
          subject: newCourseSubject,
          price: priceNumber,
        })
        .select()
        .single();

      if (error) throw error;

      setCourses([data, ...courses]); // Add to the top of the list
      // Reset form and hide it
      setNewCourseTitle('');
      setNewCourseDescription('');
      setNewCourseSubject('');
      setNewCoursePrice('');
      setIsAdding(false);
      Alert.alert('Success', 'Course added successfully!');

    } catch (error) {
      console.error('Error adding course:', error);
      Alert.alert('Error', 'Failed to add the course.');
    }
  };

  // Handle deleting a course
  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this course?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('courses')
                .delete()
                .eq('id', courseId);

              if (error) throw error;

              setCourses(courses.filter(course => course.id !== courseId));
              Alert.alert('Success', 'Course deleted successfully!');
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete the course.');
            }
          },
        },
      ]
    );
  };

  // Render item for FlatList
  const renderCourseItem = ({ item }: { item: Course }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseSubject}>{item.subject}</Text>
        <Text style={styles.courseDescription}>{item.description || 'No description'}</Text>
        <Text style={styles.coursePrice}>{item.price} QAR</Text>
      </View>
      <View style={styles.courseActions}>
        {/* <TouchableOpacity style={styles.actionButton}> // Edit functionality can be added later
          <Edit size={20} color="#4F46E5" />
        </TouchableOpacity> */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleDeleteCourse(item.id)}
        >
          <Trash2 size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Courses</Text>
      </View>

      {/* Add Course Button/Form Toggle */}
      {!isAdding && (
        <TouchableOpacity 
          style={styles.addCourseButton}
          onPress={() => setIsAdding(true)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addCourseButtonText}>Add New Course</Text>
        </TouchableOpacity>
      )}

      {/* Add Course Form */}
      {isAdding && (
        <View style={styles.addFormContainer}>
          <Text style={styles.formTitle}>New Course Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Course Title *"
            value={newCourseTitle}
            onChangeText={setNewCourseTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Course Description"
            value={newCourseDescription}
            onChangeText={setNewCourseDescription}
            multiline
          />
          <TextInput
            style={styles.input}
            placeholder="Subject *"
            value={newCourseSubject}
            onChangeText={setNewCourseSubject}
          />
          <TextInput
            style={styles.input}
            placeholder="Price (QAR) *"
            value={newCoursePrice}
            onChangeText={setNewCoursePrice}
            keyboardType="numeric"
          />
          <View style={styles.formActions}>
            <TouchableOpacity 
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => setIsAdding(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.formButton, styles.saveButton]}
              onPress={handleAddCourse}
            >
              <Text style={styles.saveButtonText}>Save Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List of Existing Courses */}
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          !isLoading && !isAdding && (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No Courses Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first course using the button above.
              </Text>
            </View>
          )
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
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
  addCourseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    margin: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addCourseButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  addFormContainer: {
    backgroundColor: '#F9FAFB',
    margin: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  formButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4B5563',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
  },
  saveButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  courseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  courseSubject: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#4F46E5',
    marginBottom: 8,
  },
  courseDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  coursePrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#10B981',
  },
  courseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

