
"use server";

// This is a mock service that simulates fetching and saving student data.
// It is used to bypass the need for a fully configured Firestore database in this prototype.

import { Timestamp } from 'firebase/firestore';

export interface Student {
    id: string;
    name: string;
    className: string;
    createdAt: string; 
}

export interface QuizResult {
    id: string;
    studentId: string;
    quizName: string;
    quizData: any;
    savedAt: Timestamp;
}

// Predefined list of mock students
const mockStudents: Student[] = [
    { id: '1', name: 'Alice Johnson', className: 'Grade 5 Math', createdAt: new Date().toISOString() },
    { id: '2', name: 'Bob Williams', className: 'Grade 5 Math', createdAt: new Date().toISOString() },
    { id: '3', name: 'Charlie Brown', className: 'Grade 6 Science', createdAt: new Date().toISOString() },
];

// In-memory store for quiz results for the demo
const mockQuizResults: QuizResult[] = [];


export async function addStudent(name: string, className: string): Promise<string> {
    console.log(`Mock addStudent called with: ${name}, ${className}`);
    const newStudent: Student = {
        id: (mockStudents.length + 1).toString(),
        name,
        className,
        createdAt: new Date().toISOString(),
    };
    mockStudents.push(newStudent);
    return newStudent.id;
}

export async function getStudents(): Promise<Student[]> {
    console.log("Mock getStudents called.");
    return [...mockStudents];
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
