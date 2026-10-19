
import { deleteImageFromCLoudinary } from "../../config/cloudinary.config";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { blogSearchableFields } from "./blog.constant";
import { IBlog } from "./blog.interface";
import { Blog } from "./blog.model";

const createBlog = async (payload: IBlog) => {
    const existingBlog = await Blog.findOne({ slug: payload.slug });
    if (existingBlog) {
        throw new Error("A Blog with this slug already exists.");
    }

    const blog = await Blog.create(payload)

    return blog;
};

const getAllBlog = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Blog.find(), query)

    const blogs = await queryBuilder
        .search(blogSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate()

    const [data, meta] = await Promise.all([
        blogs.build(),
        queryBuilder.getMeta()
    ])
    return {
        data,
        meta
    }
};

const getSingleBlog = async (slug: string) => {
    const blog = await Blog.findOne({ slug })
    // .populate("category")
    // .populate("author", "name email");

    if (blog) {
        blog.views = (blog.views || 0) + 1; // ✅ Auto increment views
        await blog.save();
    }
    return {
        data: blog,
    }
};

const updateBlog = async (id: string, payload: Partial<IBlog>) => {
    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
        throw new Error("Blog not found.");
    }
    const duplicateBlog = await Blog.findOne({
        name: payload.slug,
        _id: { $ne: id },
    });

    if (duplicateBlog) {
        throw new Error("A blog with this slug already exists.");
    }
    const updatedBlog = await Blog.findByIdAndUpdate(id, payload, { new: true });
    if (payload.thumbnail && existingBlog.thumbnail) {
        await deleteImageFromCLoudinary(existingBlog.thumbnail)
    }
    return updatedBlog;
};

const deleteBlog = async (id: string) => {
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
        throw new Error("Blog not found.");
    }
    if (existingBlog.thumbnail) {
        await deleteImageFromCLoudinary(existingBlog.thumbnail)
    }
    await Blog.findByIdAndDelete(id);
    return null;

};

export const BlogService = {
    createBlog,
    getSingleBlog,
    getAllBlog,
    updateBlog,
    deleteBlog,
};
