
"use server";

// This is a mock service that simulates fetching and saving student data.
// It is used to bypass the need for a fully configured Firestore database in this prototype.

import { Timestamp } from 'firebase/firestore';

export interface Student {
    id: string;
    name: string;
    className: string;
    createdAt: string; 
    quizzesCompleted: number;
    averageScore: number;
    status: 'On Track' | 'Needs Attention' | 'Excelling';
    lastActivityDate: string;
    avatar: string;
}

export interface QuizResult {
    id: string;
    studentId: string;
    quizName: string;
    quizData: any;
    savedAt: Timestamp;
}

// Predefined list of mock students
const mockStudentsData = [
    { id: '1', name: 'Alice Johnson', className: 'Grade 5 Math', createdAt: new Date().toISOString(), avatar: 'https://placehold.co/100x100.png' },
    { id: '2', name: 'Bob Williams', className: 'Grade 5 Math', createdAt: new Date().toISOString(), avatar: 'https://placehold.co/100x100.png' },
    { id: '3', name: 'Charlie Brown', className: 'Grade 6 Science', createdAt: new Date().toISOString(), avatar: 'https://placehold.co/100x100.png' },
    { id: '4', name: 'Diana Prince', className: 'Grade 6 Science', createdAt: new Date().toISOString(), avatar: 'https://placehold.co/100x100.png' },
    { id: '5', name: 'Ethan Hunt', className: 'Grade 5 Math', createdAt: new Date().toISOString(), avatar: 'https://placehold.co/100x100.png' },
    { id: '6', name: 'Fiona Glenanne', className: 'Grade 5 Math', createdAt: new Date().toISOString(), avatar: 'https://placehold.co/100x100.png' },
];

// In-memory store for quiz results for the demo
const mockQuizResults: QuizResult[] = [
    // Alice
    { id: 'qr-1', studentId: '1', quizName: 'Fractions', savedAt: Timestamp.fromDate(new Date('2024-05-20T10:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}]}}, // 80%
    { id: 'qr-2', studentId: '1', quizName: 'Decimals', savedAt: Timestamp.fromDate(new Date('2024-05-22T11:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}, {answer: 'e'}]}}, // 100%
    // Bob
    { id: 'qr-3', studentId: '2', quizName: 'Photosynthesis', savedAt: Timestamp.fromDate(new Date('2024-05-21T09:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}]}}, // 40%
    // Charlie
    { id: 'qr-4', studentId: '3', quizName: 'The Solar System', savedAt: Timestamp.fromDate(new Date('2024-05-19T14:00:00Z')), quizData: { questions: [ {answer: 'a'}]}}, // 20%
    { id: 'qr-5', studentId: '3', quizName: 'Gravity', savedAt: Timestamp.fromDate(new Date('2024-05-23T15:00:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}]}}, // 40%
    // Diana
    { id: 'qr-6', studentId: '4', quizName: 'The Solar System', savedAt: Timestamp.fromDate(new Date('2024-05-24T10:30:00Z')), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}, {answer: 'e'}]}}, // 100%
];


export async function addStudent(name: string, className: string): Promise<string> {
    console.log(`Mock addStudent called with: ${name}, ${className}`);
    const newStudent = {
        id: (mockStudentsData.length + 1).toString(),
        name,
        className,
        createdAt: new Date().toISOString(),
        avatar: 'https://placehold.co/100x100.png',
    };
    mockStudentsData.push(newStudent);
    return newStudent.id;
}

function calculateMetrics(studentId: string) {
    const results = mockQuizResults.filter(r => r.studentId === studentId);
    const quizzesCompleted = results.length;
    
    if (quizzesCompleted === 0) {
        return { 
            quizzesCompleted: 0, 
            averageScore: 0,
            status: 'Needs Attention' as const,
            lastActivityDate: "No activity yet"
        };
    }
    
    // For mock purposes, we'll generate a "score" based on number of questions (e.g., 20 points per question)
    const totalPossibleScore = results.reduce((acc, curr) => acc + curr.quizData.questions.length * 20, 0);
    // Let's assume a mock score where they get 80% of questions right on average
    const totalActualScore = results.reduce((acc, curr) => {
      const questionCount = curr.quizData.questions.length;
      // Let's simulate different scores for different students for better visualization
      if (studentId === '1') return acc + (questionCount * 18); // 90%
      if (studentId === '2') return acc + (questionCount * 12); // 60%
      if (studentId === '3') return acc + (questionCount * 10); // 50%
      if (studentId === '4') return acc + (questionCount * 19); // 95%
      return acc + (questionCount * 15); // 75%
    }, 0);

    const averageScore = Math.round((totalActualScore / totalPossibleScore) * 100);

    let status: 'On Track' | 'Needs Attention' | 'Excelling' = 'On Track';
    if (averageScore < 60) {
        status = 'Needs Attention';
    } else if (averageScore > 85) {
        status = 'Excelling';
    }

    const lastActivity = results.reduce((latest, current) => {
        return current.savedAt.seconds > latest.savedAt.seconds ? current : latest;
    });

    return { 
        quizzesCompleted, 
        averageScore,
        status,
        lastActivityDate: lastActivity.savedAt.toDate().toLocaleDateString()
    };
}


export async function getStudents(): Promise<Student[]> {
    console.log("Mock getStudents called.");
    return mockStudentsData.map(student => ({
        ...student,
        ...calculateMetrics(student.id),
    }));
}

export async function saveQuizResult(studentId: string, quizName: string, quizData: any): Promise<string> {
    console.log(`Mock saveQuizResult called for studentId: ${studentId}`);
    const newResult: QuizResult = {
        id: `qr-${mockQuizResults.length + 1}`,
        studentId,
        quizName,
        quizData,
        savedAt: Timestamp.now(),
    };
    mockQuizResults.push(newResult);
    return newResult.id;
}

export async function getStudentResults(studentId: string): Promise<QuizResult[]> {
    console.log(`Mock getStudentResults called for studentId: ${studentId}`);
    return mockQuizResults.filter(r => r.studentId === studentId);
}
