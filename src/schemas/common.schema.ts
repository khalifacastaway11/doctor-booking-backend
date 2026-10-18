import {z} from "zod";

export const paginationQuerySchema=z.object({
    page:z.coerce.number().int().min(1).default(1),
    limit:z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery=z.infer<typeof paginationQuerySchema>

export const buildPagination=(
    total:number,
    page:number,
    limit:number,
)=>({
page,
limit,
total,
totalPages:Math.ceil(total/limit),
hasNext: page*limit<total,
hasPrev:page>1,
})