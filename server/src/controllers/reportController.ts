import { Request, Response } from 'express';
import {
   createReport as createReportService, 
   getApprovedReports as getApprovedReportsService 
  } from '../services/reportService';
import { UserDTO } from '../interfaces/UserDTO';
import { ReportCategory } from '../interfaces/ReportDTO';

export const createReport = async (req: Request, res: Response) => {
    try{
        const { title, description, category, latitude,longitude, isAnonymous, photos } = req.body;
        const user = req.user as UserDTO & { id: number }; //need to get the userId

        //citizen must be logged in to create a report
        if(!user){
            return res.status(401).json({ 
                error: 'Unauthorized', message: 'User not logged in' }
            );
        }

        //validate required fields myabe can move it to servcie
        if(!title || !description || !category || latitude === undefined || longitude === undefined || !photos){
            return res.status(400).json({ 
                error: 'Bad Request', message: 'Missing required fields' }
            );
        }

        const reportData ={
            title,
            description,
            category: category as ReportCategory,
            latitude,
            longitude,
            isAnonymous,
            photos,
            userId: user.id
        }

        const newReport = await createReportService(reportData);

        return res.status(201).json({
            message: 'Report created successfully',
            report: newReport
        });
    } catch (err) {
        console.error("Error creating report", err);
        return res.status(500).json({ 
            error: 'Internal Server Error', message: 'Unable to create report' }
        );
    }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await getApprovedReportsService();
    res.status(200).json(reports);

  } catch (error) {
    console.error('Error during report retrieval:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Error during report retrieval'
    });
  }
};