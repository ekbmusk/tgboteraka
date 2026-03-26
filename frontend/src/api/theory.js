import client from './client'

export const theoryAPI = {
  getTopics: () => client.get('/theory/topics'),
  getTopicDetail: (topicId) => client.get(`/theory/topics/${topicId}`),
  getSubtopics: (topicId) => client.get(`/theory/topics/${topicId}/subtopics`),
  getLectures: () => client.get('/theory/lectures'),
  getLectureDetail: (topicId) => client.get(`/theory/lectures/${topicId}`),
}
