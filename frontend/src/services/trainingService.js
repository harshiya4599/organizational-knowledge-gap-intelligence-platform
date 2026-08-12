/**
 * trainingService.js
 * Hybrid backend API & persistent store service for /trainings CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import { addCollectionItem, updateCollectionItem, deleteCollectionItem } from '../utils/hybridStore';

export function normalizeTraining(t) {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name || t.title || `Training Program #${t.id}`,
    title: t.name || t.title || `Training Program #${t.id}`,
    description: t.description || 'Organizational skill development & competency upskilling program.',
    dept: t.dept || t.department || 'Engineering',
    trainer: t.trainer || 'Certified Corporate Instructor',
    status: t.status || 'Active',
    enrolled: t.enrolled || 16,
    duration: t.duration || '3 Weeks',
    startDate: t.startDate || '2026-09-01',
    recommendedForSkill: t.recommendedForSkill || 'Core Technology',
  };
}

export function getTrainings() {
  return fetchWithFallback({
    request: () => api.get('/trainings'),
    normalize: normalizeTraining,
    fallbackKey: 'trainings',
    moduleName: 'Trainings',
  });
}

export function getTrainingById(id) {
  return fetchWithFallback({
    request: () => api.get(`/trainings/${id}`),
    normalize: normalizeTraining,
    fallbackKey: 'trainings',
    moduleName: 'Training Details',
  }).then(res => {
    if (Array.isArray(res)) {
      return res.find(t => String(t.id) === String(id)) || res[0];
    }
    return res;
  });
}

export async function addTraining(trainingData) {
  try {
    const res = await api.post('/trainings', trainingData);
    const mapped = normalizeTraining(res.data);
    addCollectionItem('trainings', mapped);
    return mapped;
  } catch (err) {
    console.warn('[TrainingService] Backend addTraining failed, saving to hybrid store:', err);
    const mapped = normalizeTraining(trainingData);
    return addCollectionItem('trainings', mapped);
  }
}

export async function updateTraining(id, trainingData) {
  try {
    const res = await api.put(`/trainings/${id}`, trainingData);
    const mapped = normalizeTraining(res.data);
    updateCollectionItem('trainings', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[TrainingService] Backend updateTraining failed, updating hybrid store:', err);
    const mapped = normalizeTraining({ ...trainingData, id });
    return updateCollectionItem('trainings', id, mapped);
  }
}

export async function deleteTraining(id) {
  try {
    await api.delete(`/trainings/${id}`);
    deleteCollectionItem('trainings', id);
    return true;
  } catch (err) {
    console.warn('[TrainingService] Backend deleteTraining failed, deleting from hybrid store:', err);
    deleteCollectionItem('trainings', id);
    return true;
  }
}
