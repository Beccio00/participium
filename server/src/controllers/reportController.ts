import { Request, Response } from 'express';
import { prisma } from '../index';

export const createReport = async (req: Request, res: Response) => {
    try{
        const { title, description, category, latitude,longitude, isAnonymous } = req.body;
        const user = req.user;

        //citizen must be logged in to create a report
        if(!user){
            return res.status(401).json({ 
                error: 'Unauthorized', message: 'User not logged in' }
            );
        }

        //validate required fields
        if(!title || !description || !category || latitude === undefined || longitude === undefined){
            return res.status(400).json({ 
                error: 'Bad Request', message: 'Missing required fields' }
            );
        }

        const newReport = await (prisma as any).report.create({
            data: {
                title,
                description,
                category,
                latitude,
                longitude,
                isAnonymous: isAnonymous || false,
                userId: user,
                status: 'PENDING_APPROVAL'
            }
        });

        return res.status(201).json({
            message: 'Report created successfully',
            report: {
                id: newReport.id,
                title: newReport.title,
                description: newReport.description,
                category: newReport.category,
                latitude: newReport.latitude,
                longitude: newReport.longitude,
                isAnonymous: newReport.isAnonymous,
                status: newReport.status,
                createdAt: newReport.createdAt
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            error: 'Internal Server Error', message: 'Unable to create report' }
        );
    }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    type ReportWithUser = {
      id: number;
      title: string;
      category: string;
      latitude: number;
      longitude: number;
      status: string;
      isAnonymous: boolean;
      createdAt: Date;
      user: {
        firstName: string | null; //null if user wants to be anonymous
        lastName: string | null; //null if user wants to be anonymous
      } | null;
    };

    const reports: ReportWithUser[] = await (prisma as any).report.findMany({
      where: {
        status: 'APPROVED' //only approved reports are displayed in the map
      },
      select: {
        id: true,
        title: true,
        category: true,
        latitude: true,
        longitude: true,
        status: true,
        isAnonymous: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    //formatting reports for response
    const formattedReports = reports.map((report: ReportWithUser) => ({
      id: report.id,
      title: report.title,
      category: report.category,
      location: {
        latitude: report.latitude,
        longitude: report.longitude
      },
      status: report.status,
      reporter: report.isAnonymous ? 'Anonymous' : 
        `${report.user?.firstName ?? ''} ${report.user?.lastName ?? ''}`.trim() || 'Anonymous',
      createdAt: report.createdAt
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Error during report retrieval:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Error during report retrieval'
    });
  }
};