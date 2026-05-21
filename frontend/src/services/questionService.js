import apiClient from './api';

export async function getPlaceQuestions(placeId) {
  const response = await apiClient.get(`/questions/place/${placeId}`);
  return response.data;
}

export async function createPlaceQuestion(placeId, payload) {
  const response = await apiClient.post('/questions', {
    placeId,
    title: payload.title || undefined,
    questionText: payload.questionText,
  });
  return response.data;
}

export async function createQuestionAnswer(questionId, payload) {
  const response = await apiClient.post(`/questions/${questionId}/answers`, {
    answerText: payload.answerText,
  });
  return response.data;
}

export async function deleteQuestion(questionId) {
  await apiClient.delete(`/questions/${questionId}`);
}