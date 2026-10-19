
import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { BlogService } from './blog.service';
import { IBlog } from './blog.interface';

const createBlog = catchAsync(async (req: Request, res: Response) => {
      const payload: IBlog = {
            ...req.body,
            thumbnail: req.file?.path
        }
    const result = await BlogService.createBlog(payload);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Blog created successfully',
        data: result,
    });
});

const getAllBlog = catchAsync(async (req: Request, res: Response) => {

    const query = req.query
    const result = await BlogService.getAllBlog(query as Record<string, string>);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Blogs retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});

const getSingleBlog = catchAsync(async (req: Request, res: Response) => {
    const slug = req.params.slug
    const result = await BlogService.getSingleBlog(slug);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Blog retrieved successfully',
        data: result,
    });
});
const updateBlog = catchAsync(async (req: Request, res: Response) => {
    const payload: IBlog = {
        ...req.body,
       thumbnail: req.file?.path
    }
    const result = await BlogService.updateBlog(req.params.id, payload);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Blog updated successfully',
        data: result,
    });
});
const deleteBlog = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await BlogService.deleteBlog(id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Blog deleted successfully',
        data: result,
    });
});
export const BlogController = {
    createBlog,
    getAllBlog,
    getSingleBlog,
    updateBlog,
    deleteBlog,
};