import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
}

export const apiResponse = {
  success: <T>(data: T, meta?: ApiResponse['meta'], status = 200) => {
    return NextResponse.json(
      { success: true, data, meta },
      { status }
    );
  },

  error: (message: string, code = 'INTERNAL_ERROR', status = 500) => {
    return NextResponse.json(
      { success: false, error: { code, message } },
      { status }
    );
  },
};
