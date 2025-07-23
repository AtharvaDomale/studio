
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
    { id: '1', name: 'Alice Johnson', className: 'Grade 5 Math', createdAt: new Date().toISOString() },
    { id: '2', name: 'Bob Williams', className: 'Grade 5 Math', createdAt: new Date().toISOString() },
    { id: '3', name: 'Charlie Brown', className: 'Grade 6 Science', createdAt: new Date().toISOString() },
    { id: '4', name: 'Diana Prince', className: 'Grade 6 Science', createdAt: new Date().toISOString() },
    { id: '5', name: 'Ethan Hunt', className: 'Grade 5 Math', createdAt: new Date().toISOString() },
];

// In-memory store for quiz results for the demo
const mockQuizResults: QuizResult[] = [
    // Alice
    { id: 'qr-1', studentId: '1', quizName: 'Fractions', savedAt: Timestamp.now(), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}]}},
    { id: 'qr-2', studentId: '1', quizName: 'Decimals', savedAt: Timestamp.now(), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}]}},
    // Bob
    { id: 'qr-3', studentId: '2', quizName: 'Photosynthesis', savedAt: Timestamp.now(), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}]}},
    // Charlie
    { id: 'qr-4', studentId: '3', quizName: 'The Solar System', savedAt: Timestamp.now(), quizData: { questions: [ {answer: 'a'}]}},
    // Diana
    { id: 'qr-5', studentId: '4', quizName: 'The Solar System', savedAt: Timestamp.now(), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}, {answer: 'c'}, {answer: 'd'}, {answer: 'e'}]}},
    { id: 'qr-6', studentId: '4', quizName: 'Gravity', savedAt: Timestamp.now(), quizData: { questions: [ {answer: 'a'}, {answer: 'b'}]}},

];


export async function addStudent(name: string, className: string): Promise<string> {
    console.log(`Mock addStudent called with: ${name}, ${className}`);
    const newStudent = {
        id: (mockStudentsData.length + 1).toString(),
        name,
        className,
        createdAt: new Date().toISOString(),
    };
    mockStudentsData.push(newStudent);
    return newStudent.id;
}

function calculateMetrics(studentId: string) {
    const results = mockQuizResults.filter(r => r.studentId === studentId);
    const quizzesCompleted = results.length;
    if (quizzesCompleted === 0) {
        return { quizzesCompleted: 0, averageScore: 0 };
    }
    // For mock purposes, we'll generate a "score" based on number of questions
    const totalScore = results.reduce((acc, curr) => acc + curr.quizData.questions.length * 20, 0);
    const averageScore = Math.round(totalScore / quizzesCompleted);

    return { quizzesCompleted, averageScore };
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
