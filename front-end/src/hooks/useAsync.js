import { useState, useEffect } from 'react';

export default function useAsync(handler, immediate = true) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const act = (...args) => {
        setLoading(true);
        setError(null);
        return handler(...args)
            .then((res) => {
                setData(res);
                setLoading(false);
            })
            .catch((err) => {
                setError(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (immediate) {
            act();
        }
    }, []);

    return {
        data,
        loading,
        error,
        act,
    };
}
