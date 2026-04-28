import axios from 'axios';

const API_BASE = '/api/business-reports/';

export const listReports = async () => {
  const res = await axios.get(API_BASE);
  return res.data;
};

export const getReport = async (id) => {
  const res = await axios.get(`${API_BASE}${id}/`);
  return res.data;
};

export const createReport = async (payload) => {
  const res = await axios.post(API_BASE, payload);
  return res.data;
};

export const updateReport = async (id, payload) => {
  const res = await axios.put(`${API_BASE}${id}/`, payload);
  return res.data;
};

export const deleteReport = async (id) => {
  const res = await axios.delete(`${API_BASE}${id}/`);
  return res.data;
};
