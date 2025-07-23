
"use server";

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, query, where, Timestamp } from 'firebase/firestore';

export interface Student {
    id: string;
    name: string;
    className: string;
    createdAt: string; // Changed to string to be serializable
}

export interface QuizResult {
    id: string;
    studentId: string;
    quizName: string;
    quizData: any;
    savedAt: Timestamp;
}

export async function addStudent(name: string, className: string): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "students"), {
            name: name,
            className: className,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw new Error("Could not add student to database.");
    }
}

export async function getStudents(): Promise<Student[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const students: Student[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            students.push({ 
                id: doc.id,
                name: data.name,
                className: data.className,
                // Convert timestamp to a serializable string
                createdAt: data.createdAt.toDate().toISOString(),
            } as Student);
        });
        return students;
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw new Error("Could not retrieve students from database.");
    }
}

export async function saveQuizResult(studentId: string, quizName: string, quizData: any): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "quizResults"), {
            studentId: studentId,
            quizName: quizName,
            quizData: quizData,
            savedAt: Timestamp.now(),
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding quiz result: ", e);
        throw new Error("Could not save quiz result.");
    }
}

export async function getStudentResults(studentId: string): Promise<QuizResult[]> {
    try {
        const q = query(collection(db, "quizResults"), where("studentId", "==", studentId));
        const querySnapshot = await getDocs(q);
        const results: QuizResult[] = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() } as QuizResult);
        });
        return results;
    } catch (e) {
        console.error("Error getting student results: ", e);
        throw new Error("Could not retrieve student results.");
    }
}
